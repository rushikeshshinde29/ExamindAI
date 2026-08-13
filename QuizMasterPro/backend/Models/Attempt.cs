using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizMasterPro.API.Data.Models;

public class Attempt
{
    [Key] public int Id { get; set; }
    public int QuizId { get; set; }
    public int StudentId { get; set; }
    public double TotalMarks { get; set; } = 0;
    public double ObtainedMarks { get; set; } = 0;
    public double Percentage { get; set; } = 0;
    public bool IsPassed { get; set; } = false;
    [MaxLength(20)] public string Status { get; set; } = "in_progress";
    public DateTime StartTime { get; set; } = DateTime.UtcNow;
    public DateTime? EndTime { get; set; }
    public int TimeTaken { get; set; } = 0;
    public int AttemptNumber { get; set; } = 1;
    public int WarningCount { get; set; } = 0;
    public bool IsDisqualified { get; set; } = false;
    public string DisqualificationReason { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public int FocusLostCount { get; set; } = 0;
    public int PointsEarned { get; set; } = 0;
    public int Rank { get; set; } = 0;
    public int? FeedbackRating { get; set; }
    public string FeedbackComment { get; set; } = string.Empty;
    public DateTime? FeedbackSubmittedAt { get; set; }
    public bool CertificateIssued { get; set; } = false;
    public string CertificateId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("QuizId")] public Quiz Quiz { get; set; } = null!;
    [ForeignKey("StudentId")] public User Student { get; set; } = null!;
    public ICollection<AttemptAnswer> Answers { get; set; } = new List<AttemptAnswer>();
    public ICollection<AntiCheatLog> AntiCheatLogs { get; set; } = new List<AntiCheatLog>();
}

public class AttemptAnswer
{
    [Key] public int Id { get; set; }
    public int AttemptId { get; set; }
    public int QuestionId { get; set; }
    public int? SelectedOption { get; set; }
    public bool IsCorrect { get; set; } = false;
    public double MarksAwarded { get; set; } = 0;
    public int TimeTaken { get; set; } = 0;
    public bool Flagged { get; set; } = false;
    [ForeignKey("AttemptId")] public Attempt Attempt { get; set; } = null!;
    [ForeignKey("QuestionId")] public Question Question { get; set; } = null!;
}

public class AntiCheatLog
{
    [Key] public int Id { get; set; }
    public int AttemptId { get; set; }
    [MaxLength(50)] public string Event { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    [ForeignKey("AttemptId")] public Attempt Attempt { get; set; } = null!;
}

public class Certificate
{
    [Key] public int Id { get; set; }
    [Required, MaxLength(100)] public string CertificateId { get; set; } = string.Empty;
    public int AttemptId { get; set; }
    public int StudentId { get; set; }
    public int QuizId { get; set; }
    [Required] public string StudentName { get; set; } = string.Empty;
    [Required] public string QuizTitle { get; set; } = string.Empty;
    [Required] public string Subject { get; set; } = string.Empty;
    public double Score { get; set; }
    public double ObtainedMarks { get; set; }
    public double TotalMarks { get; set; }
    public string Department { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [ForeignKey("AttemptId")] public Attempt Attempt { get; set; } = null!;
    [ForeignKey("StudentId")] public User Student { get; set; } = null!;
    [ForeignKey("QuizId")] public Quiz Quiz { get; set; } = null!;
}

public class Notification
{
    [Key] public int Id { get; set; }
    public int UserId { get; set; }
    [Required] public string Title { get; set; } = string.Empty;
    [Required] public string Message { get; set; } = string.Empty;
    [MaxLength(30)] public string Type { get; set; } = "system";
    public bool IsRead { get; set; } = false;
    public string Link { get; set; } = string.Empty;
    public string Icon { get; set; } = "🔔";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [ForeignKey("UserId")] public User User { get; set; } = null!;
}
