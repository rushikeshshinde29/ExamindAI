using Microsoft.EntityFrameworkCore;
using QuizMasterPro.API.Data;
using QuizMasterPro.API.Data.Models;
using QuizMasterPro.API.DTOs.Attempt;
using QuizMasterPro.API.DTOs.Admin;
using QuizMasterPro.API.Services;

namespace QuizMasterPro.API.Services;

// ─── ATTEMPT SERVICE ─────────────────────────────────────────────────────────
public class AttemptService
{
    private readonly AppDbContext _db;

    public AttemptService(AppDbContext db) { _db = db; }

    public async Task<(bool Ok, string Msg, object? Data)> StartAsync(int studentId, StartAttemptDto dto, string ua, string ip)
    {
        var quiz = await _db.Quizzes.Include(q => q.Questions).FirstOrDefaultAsync(q => q.Id == dto.QuizId);
        if (quiz == null || !quiz.IsPublished) return (false, "Quiz not found or not published", null);
        if (!string.IsNullOrEmpty(quiz.AccessCode) && quiz.AccessCode != dto.AccessCode)
            return (false, "Invalid access code", null);

        var doneCount = await _db.Attempts.CountAsync(a => a.QuizId == dto.QuizId && a.StudentId == studentId
            && (a.Status == "completed" || a.Status == "timed_out"));
        if (doneCount >= quiz.MaxAttempts)
            return (false, $"Maximum {quiz.MaxAttempts} attempt(s) allowed", null);

        var inProgress = await _db.Attempts.FirstOrDefaultAsync(a =>
            a.QuizId == dto.QuizId && a.StudentId == studentId && a.Status == "in_progress");
        if (inProgress != null) return (true, "Resuming", MapBasic(inProgress));

        var attempt = new Attempt
        {
            QuizId = dto.QuizId, StudentId = studentId, TotalMarks = quiz.TotalMarks,
            AttemptNumber = doneCount + 1, UserAgent = ua, IpAddress = ip
        };
        _db.Attempts.Add(attempt);
        await _db.SaveChangesAsync();
        return (true, "Quiz started", MapBasic(attempt));
    }

    public async Task<(bool Ok, string Msg, AttemptResponseDto? Data)> SubmitAsync(int attemptId, int studentId, SubmitAttemptDto dto)
    {
        var attempt = await _db.Attempts.FirstOrDefaultAsync(a =>
            a.Id == attemptId && a.StudentId == studentId && a.Status == "in_progress");
        if (attempt == null) return (false, "Active attempt not found", null);

        var quiz = await _db.Quizzes.FindAsync(attempt.QuizId);
        var questions = await _db.Questions.Include(q => q.Options).Where(q => q.QuizId == attempt.QuizId).ToListAsync();

        double obtained = 0;
        var answers = new List<AttemptAnswer>();

        foreach (var ans in dto.Answers)
        {
            var q = questions.FirstOrDefault(x => x.Id == ans.QuestionId);
            if (q == null) continue;
            int correctIdx = q.Options.OrderBy(o => o.OrderIndex).Select((o, i) => (o, i)).FirstOrDefault(x => x.o.IsCorrect).i;
            bool correct = ans.SelectedOption.HasValue && ans.SelectedOption.Value == correctIdx;
            double marks = correct ? q.Marks : -q.NegativeMark;
            obtained += marks;
            q.TimesAnswered++; if (correct) q.TimesCorrect++;
            answers.Add(new AttemptAnswer
            {
                AttemptId = attempt.Id, QuestionId = ans.QuestionId,
                SelectedOption = ans.SelectedOption, IsCorrect = correct,
                MarksAwarded = marks, TimeTaken = ans.TimeTaken, Flagged = ans.Flagged
            });
        }

        obtained = Math.Max(0, obtained);
        double pct = quiz!.TotalMarks > 0 ? Math.Round(obtained / quiz.TotalMarks * 100, 2) : 0;
        bool passed = obtained >= quiz.PassingMarks;
        int betterCount = await _db.Attempts.CountAsync(a => a.QuizId == quiz.Id && a.Status == "completed" && a.Percentage > pct);
        int pts = passed ? (int)(Math.Round(pct / 10) * 5) + quiz.PointsOnPass : 0;

        attempt.ObtainedMarks = obtained; attempt.Percentage = pct; attempt.IsPassed = passed;
        attempt.Status = "completed"; attempt.EndTime = DateTime.UtcNow;
        attempt.TimeTaken = dto.TimeTaken; attempt.Rank = betterCount + 1; attempt.PointsEarned = pts;
        attempt.UpdatedAt = DateTime.UtcNow;

        _db.AttemptAnswers.AddRange(answers);
        await _db.SaveChangesAsync();

        // Update quiz stats
        var allDone = await _db.Attempts.Where(a => a.QuizId == quiz.Id && a.Status == "completed").ToListAsync();
        quiz.AttemptCount = allDone.Count;
        quiz.AverageScore = allDone.Average(a => a.Percentage);
        quiz.UpdatedAt = DateTime.UtcNow;

        // Gamification
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == studentId);
        if (user != null)
        {
            user.TotalPoints += pts;
            user.Level = user.TotalPoints / 100 + 1;
            var today = DateTime.UtcNow.Date;
            if (user.LastAttemptDate?.Date == today.AddDays(-1)) user.Streak++;
            else if (user.LastAttemptDate?.Date != today) user.Streak = 1;
            user.LastAttemptDate = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
        }

        // Certificate
        if (quiz.CertificateEnabled && pct >= quiz.CertificateMinScore && string.IsNullOrEmpty(attempt.CertificateId))
        {
            attempt.CertificateId = Guid.NewGuid().ToString();
            attempt.CertificateIssued = true;
            var student = await _db.Users.FindAsync(studentId);
            _db.Certificates.Add(new Certificate
            {
                CertificateId = attempt.CertificateId, AttemptId = attempt.Id, StudentId = studentId,
                QuizId = quiz.Id, StudentName = student!.Name, QuizTitle = quiz.Title,
                Subject = quiz.Subject, Score = pct, ObtainedMarks = obtained,
                TotalMarks = quiz.TotalMarks, Department = student.Department
            });
        }

        await _db.SaveChangesAsync();

        return (true, "Submitted!", await GetByIdAsync(attempt.Id, studentId, "student"));
    }

    public async Task<(bool Ok, object? Data)> LogAntiCheatAsync(int attemptId, int studentId, AntiCheatEventDto dto)
    {
        var attempt = await _db.Attempts.FirstOrDefaultAsync(a =>
            a.Id == attemptId && a.StudentId == studentId && a.Status == "in_progress");
        if (attempt == null) return (false, null);

        _db.AntiCheatLogs.Add(new AntiCheatLog { AttemptId = attemptId, Event = dto.Event, Details = dto.Details });
        if (new[] { "tab_switch", "copy_attempt", "right_click", "fullscreen_exit" }.Contains(dto.Event))
        {
            attempt.WarningCount++;
            if (dto.Event is "tab_switch" or "fullscreen_exit") attempt.FocusLostCount++;
        }
        var quiz = await _db.Quizzes.FindAsync(attempt.QuizId);
        if (quiz?.MaxWarnings > 0 && attempt.WarningCount >= quiz.MaxWarnings)
        {
            attempt.Status = "disqualified"; attempt.IsDisqualified = true;
            attempt.DisqualificationReason = $"Exceeded {quiz.MaxWarnings} warnings";
        }
        attempt.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return (true, new { attempt.WarningCount, Disqualified = attempt.IsDisqualified });
    }

    public async Task<List<AttemptResponseDto>> GetMyAsync(int studentId)
    {
        return await _db.Attempts.Include(a => a.Quiz).Where(a => a.StudentId == studentId)
            .OrderByDescending(a => a.CreatedAt).Select(a => MapDto(a)).ToListAsync();
    }

    public async Task<AttemptResponseDto?> GetByIdAsync(int id, int userId, string role)
    {
        var a = await _db.Attempts.Include(a => a.Quiz).Include(a => a.Student)
            .Include(a => a.Answers).ThenInclude(aa => aa.Question).ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(a => a.Id == id);
        if (a == null) return null;
        if (role == "student" && a.StudentId != userId) return null;
        return new AttemptResponseDto
        {
            Id = a.Id, QuizId = a.QuizId, QuizTitle = a.Quiz?.Title ?? "", QuizSubject = a.Quiz?.Subject ?? "",
            QuizDifficulty = a.Quiz?.Difficulty ?? "", StudentId = a.StudentId, StudentName = a.Student?.Name ?? "",
            TotalMarks = a.TotalMarks, ObtainedMarks = a.ObtainedMarks, Percentage = a.Percentage,
            IsPassed = a.IsPassed, Status = a.Status, StartTime = a.StartTime, EndTime = a.EndTime,
            TimeTaken = a.TimeTaken, AttemptNumber = a.AttemptNumber, WarningCount = a.WarningCount,
            IsDisqualified = a.IsDisqualified, PointsEarned = a.PointsEarned, Rank = a.Rank,
            CertificateIssued = a.CertificateIssued, CertificateId = a.CertificateId,
            CreatedAt = a.CreatedAt,
            Answers = a.Answers.Select(aa => new AttemptAnswerDto
            {
                QuestionId = aa.QuestionId, QuestionText = aa.Question?.Text ?? "",
                SelectedOption = aa.SelectedOption, IsCorrect = aa.IsCorrect,
                MarksAwarded = aa.MarksAwarded, Flagged = aa.Flagged,
                Options = aa.Question?.Options.OrderBy(o => o.OrderIndex).Select(o => new OptionInfoDto { Text = o.Text, IsCorrect = o.IsCorrect }).ToList() ?? new()
            }).ToList()
        };
    }

    public async Task<bool> SubmitFeedbackAsync(int attemptId, int studentId, FeedbackDto dto)
    {
        var a = await _db.Attempts.FirstOrDefaultAsync(a => a.Id == attemptId && a.StudentId == studentId && a.Status == "completed");
        if (a == null) return false;
        a.FeedbackRating = dto.Rating; a.FeedbackComment = dto.Comment; a.FeedbackSubmittedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(); return true;
    }

    private static AttemptResponseDto MapDto(Attempt a) => new()
    {
        Id = a.Id, QuizId = a.QuizId, QuizTitle = a.Quiz?.Title ?? "", QuizSubject = a.Quiz?.Subject ?? "",
        TotalMarks = a.TotalMarks, ObtainedMarks = a.ObtainedMarks, Percentage = a.Percentage,
        IsPassed = a.IsPassed, Status = a.Status, StartTime = a.StartTime, EndTime = a.EndTime,
        TimeTaken = a.TimeTaken, AttemptNumber = a.AttemptNumber, PointsEarned = a.PointsEarned,
        Rank = a.Rank, CertificateIssued = a.CertificateIssued, CertificateId = a.CertificateId, CreatedAt = a.CreatedAt
    };
    private static object MapBasic(Attempt a) => new { a.Id, a.QuizId, a.StudentId, a.Status, a.StartTime, a.TotalMarks, a.AttemptNumber };
}

// ─── ADMIN SERVICE ────────────────────────────────────────────────────────────
public class AdminService
{
    private readonly AppDbContext _db;
    public AdminService(AppDbContext db) { _db = db; }

    public async Task<DashboardStatsDto> GetStatsAsync()
    {
        var attempts = await _db.Attempts.Where(a => a.Status == "completed").ToListAsync();
        return new DashboardStatsDto
        {
            TotalStudents = await _db.Users.CountAsync(u => u.Role == "student"),
            TotalFaculty = await _db.Users.CountAsync(u => u.Role == "faculty"),
            TotalQuizzes = await _db.Quizzes.CountAsync(),
            PublishedQuizzes = await _db.Quizzes.CountAsync(q => q.IsPublished),
            TotalAttempts = attempts.Count,
            TotalCertificates = await _db.Certificates.CountAsync(),
            OverallPassRate = attempts.Any() ? Math.Round(attempts.Count(a => a.IsPassed) * 100.0 / attempts.Count, 1) : 0,
            AverageScore = attempts.Any() ? Math.Round(attempts.Average(a => a.Percentage), 1) : 0,
            TopQuizzes = await _db.Quizzes.Where(q => q.IsPublished).OrderByDescending(q => q.AttemptCount).Take(5)
                .Select(q => new TopQuizDto { Id = q.Id, Title = q.Title, Subject = q.Subject, AttemptCount = q.AttemptCount, AverageScore = q.AverageScore }).ToListAsync(),
            TopStudents = await _db.Users.Where(u => u.Role == "student").OrderByDescending(u => u.TotalPoints).Take(5)
                .Select(u => new TopStudentDto { Id = u.Id, Name = u.Name, TotalPoints = u.TotalPoints, Level = u.Level, Department = u.Department }).ToListAsync()
        };
    }

    public async Task<List<object>> GetUsersAsync(string role, int page, int limit, string? search)
    {
        var q = _db.Users.Where(u => u.Role == role).AsQueryable();
        if (!string.IsNullOrEmpty(search))
            q = q.Where(u => u.Name.Contains(search) || u.Email.Contains(search));
        return await q.OrderByDescending(u => u.CreatedAt).Skip((page - 1) * limit).Take(limit)
            .Select(u => (object)new { u.Id, u.Name, u.Email, u.Role, u.Department, u.IsActive, u.IsBanned, u.TotalPoints, u.Level, u.CreatedAt, u.LastLogin })
            .ToListAsync();
    }

    public async Task<(bool Ok, string Msg)> CreateUserAsync(CreateUserDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email.ToLower()))
            return (false, "Email already exists");
        var user = new User
        {
            Name = dto.Name, Email = dto.Email.ToLower(), Role = dto.Role,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, 12),
            Department = dto.Department, StudentId = dto.StudentId,
            EmployeeId = dto.EmployeeId, Designation = dto.Designation, Course = dto.Course, Phone = dto.Phone,
            IsActive = true
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return (true, $"{dto.Role} created successfully");
    }

    public async Task<(bool Ok, string Msg)> UpdateUserStatusAsync(int userId, UpdateUserStatusDto dto)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return (false, "User not found");
        if (dto.IsActive.HasValue) user.IsActive = dto.IsActive.Value;
        if (dto.IsBanned.HasValue) { user.IsBanned = dto.IsBanned.Value; user.BanReason = dto.BanReason; }
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return (true, "Updated");
    }

    public async Task<(bool Ok, string Msg)> DeleteUserAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return (false, "User not found");
        if (user.Role == "admin") return (false, "Cannot delete admin");
        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return (true, "User deleted");
    }

    public async Task<List<object>> GetAllQuizzesAsync()
    {
        return await _db.Quizzes.Include(q => q.CreatedBy)
            .OrderByDescending(q => q.CreatedAt)
            .Select(q => (object)new { q.Id, q.Title, q.Subject, q.Difficulty, q.IsPublished, q.IsActive, q.AttemptCount, q.AverageScore, Faculty = q.CreatedBy.Name, q.CreatedAt })
            .ToListAsync();
    }
}
