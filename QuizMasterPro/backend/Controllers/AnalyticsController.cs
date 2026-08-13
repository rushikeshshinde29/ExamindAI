using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizMasterPro.API.Data;

namespace QuizMasterPro.API.Controllers;

[Authorize, Route("api/analytics")]
public class AnalyticsController : BaseController
{
    private readonly AppDbContext _db;
    public AnalyticsController(AppDbContext db) { _db = db; }

    [Authorize(Roles = "student"), HttpGet("student")]
    public async Task<IActionResult> StudentAnalytics()
    {
        var attempts = await _db.Attempts.Include(a => a.Quiz)
            .Where(a => a.StudentId == UserId && a.Status == "completed")
            .OrderByDescending(a => a.CreatedAt).ToListAsync();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == UserId);
        return Ok(new
        {
            Success = true,
            TotalAttempts = attempts.Count,
            PassCount = attempts.Count(a => a.IsPassed),
            FailCount = attempts.Count(a => !a.IsPassed),
            AverageScore = attempts.Any() ? Math.Round(attempts.Average(a => a.Percentage), 1) : 0,
            TotalPoints = user?.TotalPoints ?? 0,
            Level = user?.Level ?? 1,
            Streak = user?.Streak ?? 0,
            Certificates = await _db.Certificates.CountAsync(c => c.StudentId == UserId),
            RecentAttempts = attempts.Take(10).Select(a => new
            {
                a.Id, Quiz = a.Quiz?.Title, a.Percentage, a.IsPassed,
                a.ObtainedMarks, a.TotalMarks, a.TimeTaken, a.CreatedAt
            }),
            ScoreTrend = attempts.Take(20).OrderBy(a => a.CreatedAt).Select(a => new { Date = a.CreatedAt.ToString("MMM dd"), a.Percentage })
        });
    }

    [Authorize(Roles = "faculty"), HttpGet("faculty")]
    public async Task<IActionResult> FacultyAnalytics()
    {
        var quizzes = await _db.Quizzes.Include(q => q.Attempts).Where(q => q.CreatedById == UserId).ToListAsync();
        var allAttempts = quizzes.SelectMany(q => q.Attempts).ToList();
        return Ok(new
        {
            Success = true,
            TotalQuizzes = quizzes.Count,
            PublishedQuizzes = quizzes.Count(q => q.IsPublished),
            TotalAttempts = allAttempts.Count,
            OverallPassRate = allAttempts.Any() ? Math.Round(allAttempts.Count(a => a.IsPassed) * 100.0 / allAttempts.Count, 1) : 0,
            AverageScore = allAttempts.Any() ? Math.Round(allAttempts.Average(a => a.Percentage), 1) : 0,
            QuizPerformance = quizzes.Select(q => new
            {
                q.Id, q.Title, q.Subject, q.AttemptCount, q.AverageScore, q.IsPublished,
                PassRate = q.Attempts.Any() ? Math.Round(q.Attempts.Count(a => a.IsPassed) * 100.0 / q.Attempts.Count, 1) : 0
            })
        });
    }
}
