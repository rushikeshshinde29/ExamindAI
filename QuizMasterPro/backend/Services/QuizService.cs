using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using QuizMasterPro.API.Data;
using QuizMasterPro.API.Data.Models;
using QuizMasterPro.API.DTOs.Quiz;

namespace QuizMasterPro.API.Services;

public class QuizService
{
    private readonly AppDbContext _db;
    public QuizService(AppDbContext db) { _db = db; }

    public async Task<(List<QuizResponseDto> Data, int Total)> GetAllAsync(
        int userId, string role, int page, int limit,
        string? subject, string? difficulty, string? search)
    {
        var q = _db.Quizzes.Include(x => x.CreatedBy).Include(x => x.Questions).AsQueryable();

        if (role == "student") q = q.Where(x => x.IsPublished && x.IsActive);
        else if (role == "faculty") q = q.Where(x => x.CreatedById == userId);

        if (!string.IsNullOrEmpty(subject)) q = q.Where(x => x.Subject.Contains(subject));
        if (!string.IsNullOrEmpty(difficulty)) q = q.Where(x => x.Difficulty == difficulty);
        if (!string.IsNullOrEmpty(search))
            q = q.Where(x => x.Title.Contains(search) || x.Subject.Contains(search) || x.Description.Contains(search));

        var total = await q.CountAsync();
        var quizzes = await q.OrderByDescending(x => x.CreatedAt).Skip((page - 1) * limit).Take(limit).ToListAsync();
        return (quizzes.Select(MapToDto).ToList(), total);
    }

    public async Task<QuizResponseDto?> GetByIdAsync(int id, string role)
    {
        var quiz = await _db.Quizzes.Include(q => q.CreatedBy).Include(q => q.Questions).ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == id);
        if (quiz == null) return null;
        if (role == "student" && !quiz.IsPublished) return null;
        return MapToDto(quiz);
    }

    public async Task<QuizResponseDto> CreateAsync(CreateQuizDto dto, int createdById)
    {
        var quiz = new Quiz
        {
            Title = dto.Title, Description = dto.Description, Subject = dto.Subject,
            Category = dto.Category, Difficulty = dto.Difficulty, CreatedById = createdById,
            DurationMinutes = dto.DurationMinutes, PassingMarks = dto.PassingMarks,
            StartDate = dto.StartDate, EndDate = dto.EndDate, MaxAttempts = dto.MaxAttempts,
            ShuffleQuestions = dto.ShuffleQuestions, ShuffleOptions = dto.ShuffleOptions,
            ShowResults = dto.ShowResults, ShowAnswersAfter = dto.ShowAnswersAfter,
            Instructions = dto.Instructions, Tags = JsonSerializer.Serialize(dto.Tags),
            AccessCode = dto.AccessCode, PreventTabSwitch = dto.PreventTabSwitch,
            PreventCopyPaste = dto.PreventCopyPaste, PreventRightClick = dto.PreventRightClick,
            FullscreenRequired = dto.FullscreenRequired, MaxWarnings = dto.MaxWarnings,
            CertificateEnabled = dto.CertificateEnabled, CertificateMinScore = dto.CertificateMinScore,
            LeaderboardEnabled = dto.LeaderboardEnabled, FeedbackEnabled = dto.FeedbackEnabled,
            PointsOnPass = dto.PointsOnPass
        };
        _db.Quizzes.Add(quiz);
        await _db.SaveChangesAsync();
        return await GetByIdAsync(quiz.Id, "faculty") ?? MapToDto(quiz);
    }

    public async Task<QuizResponseDto?> UpdateAsync(int id, UpdateQuizDto dto, int userId)
    {
        var quiz = await _db.Quizzes.FirstOrDefaultAsync(q => q.Id == id && q.CreatedById == userId);
        if (quiz == null) return null;
        quiz.Title = dto.Title; quiz.Description = dto.Description; quiz.Subject = dto.Subject;
        quiz.Category = dto.Category; quiz.Difficulty = dto.Difficulty;
        quiz.DurationMinutes = dto.DurationMinutes; quiz.PassingMarks = dto.PassingMarks;
        quiz.StartDate = dto.StartDate; quiz.EndDate = dto.EndDate; quiz.MaxAttempts = dto.MaxAttempts;
        quiz.ShuffleQuestions = dto.ShuffleQuestions; quiz.ShuffleOptions = dto.ShuffleOptions;
        quiz.ShowResults = dto.ShowResults; quiz.ShowAnswersAfter = dto.ShowAnswersAfter;
        quiz.Instructions = dto.Instructions; quiz.Tags = JsonSerializer.Serialize(dto.Tags);
        quiz.AccessCode = dto.AccessCode; quiz.PreventTabSwitch = dto.PreventTabSwitch;
        quiz.PreventCopyPaste = dto.PreventCopyPaste; quiz.PreventRightClick = dto.PreventRightClick;
        quiz.MaxWarnings = dto.MaxWarnings; quiz.CertificateEnabled = dto.CertificateEnabled;
        quiz.CertificateMinScore = dto.CertificateMinScore; quiz.LeaderboardEnabled = dto.LeaderboardEnabled;
        quiz.FeedbackEnabled = dto.FeedbackEnabled; quiz.PointsOnPass = dto.PointsOnPass;
        quiz.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return MapToDto(quiz);
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var quiz = await _db.Quizzes.FirstOrDefaultAsync(q => q.Id == id && q.CreatedById == userId);
        if (quiz == null) return false;
        _db.Quizzes.Remove(quiz);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<(bool Ok, string Msg, QuizResponseDto? Data)> TogglePublishAsync(int id, int userId)
    {
        var quiz = await _db.Quizzes.Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.Id == id && q.CreatedById == userId);
        if (quiz == null) return (false, "Quiz not found", null);
        if (!quiz.IsPublished && !quiz.Questions.Any())
            return (false, "Add at least one question before publishing", null);
        quiz.IsPublished = !quiz.IsPublished;
        quiz.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return (true, quiz.IsPublished ? "Quiz published" : "Quiz unpublished", MapToDto(quiz));
    }

    public async Task<object> GetResultsAsync(int quizId)
    {
        var attempts = await _db.Attempts
            .Include(a => a.Student)
            .Where(a => a.QuizId == quizId && (a.Status == "completed" || a.Status == "timed_out"))
            .OrderByDescending(a => a.Percentage).ThenBy(a => a.TimeTaken)
            .ToListAsync();

        return new
        {
            Data = attempts.Select(a => new
            {
                a.Id, a.Percentage, a.ObtainedMarks, a.TotalMarks, a.IsPassed,
                a.TimeTaken, a.AttemptNumber, a.Status, a.CreatedAt,
                Student = new { a.Student.Id, a.Student.Name, a.Student.Email, a.Student.StudentId, a.Student.Department }
            }),
            Stats = new
            {
                TotalAttempts = attempts.Count,
                PassCount = attempts.Count(a => a.IsPassed),
                FailCount = attempts.Count(a => !a.IsPassed),
                AverageScore = attempts.Any() ? Math.Round(attempts.Average(a => a.Percentage), 2) : 0,
                HighestScore = attempts.Any() ? attempts.Max(a => a.Percentage) : 0,
                LowestScore = attempts.Any() ? attempts.Min(a => a.Percentage) : 0
            }
        };
    }

    public static QuizResponseDto MapToDto(Quiz q) => new()
    {
        Id = q.Id, Title = q.Title, Description = q.Description, Subject = q.Subject,
        Category = q.Category, Difficulty = q.Difficulty, CreatedById = q.CreatedById,
        CreatedByName = q.CreatedBy?.Name ?? "", DurationMinutes = q.DurationMinutes,
        TotalMarks = q.TotalMarks, PassingMarks = q.PassingMarks, IsPublished = q.IsPublished,
        IsActive = q.IsActive, StartDate = q.StartDate, EndDate = q.EndDate,
        MaxAttempts = q.MaxAttempts, ShuffleQuestions = q.ShuffleQuestions,
        ShowResults = q.ShowResults, ShowAnswersAfter = q.ShowAnswersAfter,
        Instructions = q.Instructions,
        Tags = TryParse(q.Tags),
        AttemptCount = q.AttemptCount, AverageScore = q.AverageScore,
        CertificateEnabled = q.CertificateEnabled, CertificateMinScore = q.CertificateMinScore,
        LeaderboardEnabled = q.LeaderboardEnabled, FeedbackEnabled = q.FeedbackEnabled,
        PointsOnPass = q.PointsOnPass, IsAIGenerated = q.IsAIGenerated,
        QuestionCount = q.Questions?.Count ?? 0,
        AntiCheat = new() { PreventTabSwitch = q.PreventTabSwitch, PreventCopyPaste = q.PreventCopyPaste, PreventRightClick = q.PreventRightClick, FullscreenRequired = q.FullscreenRequired, MaxWarnings = q.MaxWarnings },
        CreatedAt = q.CreatedAt, UpdatedAt = q.UpdatedAt
    };

    private static List<string> TryParse(string s) { try { return JsonSerializer.Deserialize<List<string>>(s) ?? new(); } catch { return new(); } }
}

// ─── QUESTION SERVICE ────────────────────────────────────────────────────────
public class QuestionService
{
    private readonly AppDbContext _db;
    public QuestionService(AppDbContext db) { _db = db; }

    public async Task<List<QuestionResponseDto>> GetByQuizAsync(int quizId, bool hideAnswers = false)
    {
        var qs = await _db.Questions.Include(q => q.Options)
            .Where(q => q.QuizId == quizId).OrderBy(q => q.Order).ToListAsync();
        return qs.Select(q => ToDto(q, hideAnswers)).ToList();
    }

    public async Task<QuestionResponseDto> CreateAsync(int quizId, CreateQuestionDto dto, int userId)
    {
        var q = new Question
        {
            QuizId = quizId, Text = dto.Text, Type = dto.Type, Explanation = dto.Explanation,
            Hint = dto.Hint, Marks = dto.Marks, NegativeMark = dto.NegativeMark,
            Difficulty = dto.Difficulty, Tags = JsonSerializer.Serialize(dto.Tags),
            CreatedById = userId, Order = dto.Order,
            Options = dto.Options.Select((o, i) => new QuestionOption { Text = o.Text, IsCorrect = o.IsCorrect, OrderIndex = i }).ToList()
        };
        _db.Questions.Add(q);
        await _db.SaveChangesAsync();
        await RecalcMarks(quizId);
        return ToDto(q);
    }

    public async Task<QuestionResponseDto?> UpdateAsync(int id, CreateQuestionDto dto, int userId)
    {
        var q = await _db.Questions.Include(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == id && q.CreatedById == userId);
        if (q == null) return null;
        q.Text = dto.Text; q.Type = dto.Type; q.Explanation = dto.Explanation;
        q.Hint = dto.Hint; q.Marks = dto.Marks; q.NegativeMark = dto.NegativeMark;
        q.Difficulty = dto.Difficulty; q.Order = dto.Order; q.UpdatedAt = DateTime.UtcNow;
        _db.QuestionOptions.RemoveRange(q.Options);
        q.Options = dto.Options.Select((o, i) => new QuestionOption { Text = o.Text, IsCorrect = o.IsCorrect, OrderIndex = i }).ToList();
        await _db.SaveChangesAsync();
        await RecalcMarks(q.QuizId);
        return ToDto(q);
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var q = await _db.Questions.FirstOrDefaultAsync(q => q.Id == id && q.CreatedById == userId);
        if (q == null) return false;

        var hasAttempts = await _db.AttemptAnswers.AnyAsync(aa => aa.QuestionId == id);
        if (hasAttempts)
        {
            throw new InvalidOperationException("Cannot delete this question because it has already been answered by students in existing attempts.");
        }

        var quizId = q.QuizId;
        _db.Questions.Remove(q);
        await _db.SaveChangesAsync();
        await RecalcMarks(quizId);
        return true;
    }

    public async Task<List<QuestionResponseDto>> BulkCreateAsync(int quizId, List<CreateQuestionDto> dtos, int userId, bool isAi = false, bool deleteExisting = false)
    {
        if (deleteExisting)
        {
            var existing = await _db.Questions
                .Include(q => q.Options)
                .Where(q => q.QuizId == quizId)
                .OrderBy(q => q.Order)
                .ToListAsync();

            int numDtos = dtos.Count;
            int numExisting = existing.Count;

            for (int i = 0; i < Math.Max(numDtos, numExisting); i++)
            {
                if (i < numDtos && i < numExisting)
                {
                    var dbQ = existing[i];
                    var dto = dtos[i];

                    dbQ.Text = dto.Text;
                    dbQ.Type = dto.Type;
                    dbQ.Explanation = dto.Explanation;
                    dbQ.Hint = dto.Hint;
                    dbQ.Marks = dto.Marks;
                    dbQ.NegativeMark = dto.NegativeMark;
                    dbQ.Difficulty = dto.Difficulty;
                    dbQ.Tags = JsonSerializer.Serialize(dto.Tags);
                    dbQ.Order = dto.Order;
                    dbQ.UpdatedAt = DateTime.UtcNow;

                    _db.QuestionOptions.RemoveRange(dbQ.Options);
                    dbQ.Options.Clear();

                    foreach (var o in dto.Options.Select((opt, idx) => new QuestionOption
                    {
                        Text = opt.Text,
                        IsCorrect = opt.IsCorrect,
                        OrderIndex = idx
                    }))
                    {
                        dbQ.Options.Add(o);
                    }
                }
                else if (i < numDtos)
                {
                    var dto = dtos[i];
                    var newQ = new Question
                    {
                        QuizId = quizId,
                        Text = dto.Text,
                        Type = dto.Type,
                        Explanation = dto.Explanation,
                        Hint = dto.Hint,
                        Marks = dto.Marks,
                        NegativeMark = dto.NegativeMark,
                        Difficulty = dto.Difficulty,
                        Tags = JsonSerializer.Serialize(dto.Tags),
                        CreatedById = userId,
                        Order = dto.Order,
                        IsAIGenerated = isAi,
                        Options = dto.Options.Select((opt, idx) => new QuestionOption
                        {
                            Text = opt.Text,
                            IsCorrect = opt.IsCorrect,
                            OrderIndex = idx
                        }).ToList()
                    };
                    _db.Questions.Add(newQ);
                }
                else
                {
                    var dbQ = existing[i];
                    var hasAttempts = await _db.AttemptAnswers.AnyAsync(aa => aa.QuestionId == dbQ.Id);
                    if (hasAttempts)
                    {
                        throw new InvalidOperationException($"Cannot delete Question '{dbQ.Text}' because it has already been answered by students in existing attempts. Please edit it instead.");
                    }
                    _db.Questions.Remove(dbQ);
                }
            }
        }
        else
        {
            var questions = dtos.Select(dto => new Question
            {
                QuizId = quizId, Text = dto.Text, Type = dto.Type, Explanation = dto.Explanation,
                Hint = dto.Hint, Marks = dto.Marks, NegativeMark = dto.NegativeMark,
                Difficulty = dto.Difficulty, Tags = JsonSerializer.Serialize(dto.Tags),
                CreatedById = userId, Order = dto.Order, IsAIGenerated = isAi,
                Options = dto.Options.Select((o, i) => new QuestionOption { Text = o.Text, IsCorrect = o.IsCorrect, OrderIndex = i }).ToList()
            }).ToList();
            _db.Questions.AddRange(questions);
        }

        await _db.SaveChangesAsync();
        await RecalcMarks(quizId);

        var savedQuestions = await _db.Questions
            .Include(q => q.Options)
            .Where(q => q.QuizId == quizId)
            .OrderBy(q => q.Order)
            .ToListAsync();

        return savedQuestions.Select(q => ToDto(q)).ToList();
    }

    private async Task RecalcMarks(int quizId)
    {
        var quiz = await _db.Quizzes.FindAsync(quizId);
        if (quiz == null) return;
        quiz.TotalMarks = await _db.Questions.Where(q => q.QuizId == quizId).SumAsync(q => q.Marks);
        quiz.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public static QuestionResponseDto ToDto(Question q, bool hideAnswers = false) => new()
    {
        Id = q.Id, QuizId = q.QuizId, Text = q.Text, Type = q.Type,
        Explanation = q.Explanation, Hint = q.Hint, Marks = q.Marks,
        NegativeMark = q.NegativeMark, Difficulty = q.Difficulty,
        IsAIGenerated = q.IsAIGenerated, Order = q.Order,
        TimesAnswered = q.TimesAnswered, TimesCorrect = q.TimesCorrect,
        Options = q.Options.OrderBy(o => o.OrderIndex).Select(o => new OptionResponseDto
        { Id = o.Id, Text = o.Text, IsCorrect = !hideAnswers && o.IsCorrect, OrderIndex = o.OrderIndex }).ToList()
    };
}
