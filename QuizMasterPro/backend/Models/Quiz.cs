using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizMasterPro.API.Data.Models;

public class Quiz
{
    [Key] public int Id { get; set; }
    [Required, MaxLength(200)] public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    [Required, MaxLength(100)] public string Subject { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    [MaxLength(20)] public string Difficulty { get; set; } = "medium";
    public int CreatedById { get; set; }
    public int DurationMinutes { get; set; } = 30;
    public double TotalMarks { get; set; } = 0;
    public double PassingMarks { get; set; } = 0;
    public bool IsPublished { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int MaxAttempts { get; set; } = 1;
    public bool ShuffleQuestions { get; set; } = false;
    public bool ShuffleOptions { get; set; } = false;
    public bool ShowResults { get; set; } = true;
    public bool ShowAnswersAfter { get; set; } = true;
    public string Instructions { get; set; } = string.Empty;
    public string Tags { get; set; } = "[]";
    public int AttemptCount { get; set; } = 0;
    public double AverageScore { get; set; } = 0;
    public string AccessCode { get; set; } = string.Empty;
    // Anti-cheat
    public bool PreventTabSwitch { get; set; } = true;
    public bool PreventCopyPaste { get; set; } = true;
    public bool PreventRightClick { get; set; } = true;
    public bool FullscreenRequired { get; set; } = false;
    public int MaxWarnings { get; set; } = 3;
    // Certificate
    public bool CertificateEnabled { get; set; } = false;
    public double CertificateMinScore { get; set; } = 80;
    public bool LeaderboardEnabled { get; set; } = true;
    public bool FeedbackEnabled { get; set; } = true;
    public string CoverImage { get; set; } = string.Empty;
    public int PointsOnPass { get; set; } = 10;
    public bool IsAIGenerated { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("CreatedById")] public User CreatedBy { get; set; } = null!;
    public ICollection<Question> Questions { get; set; } = new List<Question>();
    public ICollection<Attempt> Attempts { get; set; } = new List<Attempt>();
    public ICollection<Certificate> Certificates { get; set; } = new List<Certificate>();
}

public class Question
{
    [Key] public int Id { get; set; }
    public int QuizId { get; set; }
    [Required] public string Text { get; set; } = string.Empty;
    [MaxLength(20)] public string Type { get; set; } = "mcq";
    public string Explanation { get; set; } = string.Empty;
    public string Hint { get; set; } = string.Empty;
    public double Marks { get; set; } = 1;
    public double NegativeMark { get; set; } = 0;
    [MaxLength(20)] public string Difficulty { get; set; } = "medium";
    public string Tags { get; set; } = "[]";
    public int CreatedById { get; set; }
    public bool IsAIGenerated { get; set; } = false;
    public int Order { get; set; } = 0;
    public string ImageUrl { get; set; } = string.Empty;
    public int TimesAnswered { get; set; } = 0;
    public int TimesCorrect { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("QuizId")] public Quiz Quiz { get; set; } = null!;
    [ForeignKey("CreatedById")] public User CreatedBy { get; set; } = null!;
    public ICollection<QuestionOption> Options { get; set; } = new List<QuestionOption>();
    public ICollection<AttemptAnswer> AttemptAnswers { get; set; } = new List<AttemptAnswer>();
}

public class QuestionOption
{
    [Key] public int Id { get; set; }
    public int QuestionId { get; set; }
    [Required] public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; } = false;
    public int OrderIndex { get; set; } = 0;
    [ForeignKey("QuestionId")] public Question Question { get; set; } = null!;
}
