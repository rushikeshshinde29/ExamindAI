using System.ComponentModel.DataAnnotations;

namespace QuizMasterPro.API.DTOs.Quiz;

public class CreateQuizDto
{
    [Required, MaxLength(200)] public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    [Required, MaxLength(100)] public string Subject { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string Difficulty { get; set; } = "medium";
    public int DurationMinutes { get; set; } = 30;
    public double PassingMarks { get; set; } = 0;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int MaxAttempts { get; set; } = 1;
    public bool ShuffleQuestions { get; set; } = false;
    public bool ShuffleOptions { get; set; } = false;
    public bool ShowResults { get; set; } = true;
    public bool ShowAnswersAfter { get; set; } = true;
    public string Instructions { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public string AccessCode { get; set; } = string.Empty;
    public bool PreventTabSwitch { get; set; } = true;
    public bool PreventCopyPaste { get; set; } = true;
    public bool PreventRightClick { get; set; } = true;
    public bool FullscreenRequired { get; set; } = false;
    public int MaxWarnings { get; set; } = 3;
    public bool CertificateEnabled { get; set; } = false;
    public double CertificateMinScore { get; set; } = 80;
    public bool LeaderboardEnabled { get; set; } = true;
    public bool FeedbackEnabled { get; set; } = true;
    public int PointsOnPass { get; set; } = 10;
}

public class UpdateQuizDto : CreateQuizDto { }

public class AIGenerateDto
{
    [Required] public string Topic { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "medium";
    public int Count { get; set; } = 5;
    public string QuestionType { get; set; } = "mcq";
    public int QuizId { get; set; }
}

public class CreateQuestionDto
{
    [Required] public string Text { get; set; } = string.Empty;
    public string Type { get; set; } = "mcq";
    public List<OptionDto> Options { get; set; } = new();
    public string Explanation { get; set; } = string.Empty;
    public string Hint { get; set; } = string.Empty;
    public double Marks { get; set; } = 1;
    public double NegativeMark { get; set; } = 0;
    public string Difficulty { get; set; } = "medium";
    public List<string> Tags { get; set; } = new();
    public int Order { get; set; } = 0;
}

public class OptionDto
{
    [Required] public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; } = false;
}

public class QuizResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public int CreatedById { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public double TotalMarks { get; set; }
    public double PassingMarks { get; set; }
    public bool IsPublished { get; set; }
    public bool IsActive { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int MaxAttempts { get; set; }
    public bool ShuffleQuestions { get; set; }
    public bool ShowResults { get; set; }
    public bool ShowAnswersAfter { get; set; }
    public string Instructions { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public int AttemptCount { get; set; }
    public double AverageScore { get; set; }
    public bool CertificateEnabled { get; set; }
    public double CertificateMinScore { get; set; }
    public bool LeaderboardEnabled { get; set; }
    public bool FeedbackEnabled { get; set; }
    public int PointsOnPass { get; set; }
    public bool IsAIGenerated { get; set; }
    public int QuestionCount { get; set; }
    public AntiCheatDto AntiCheat { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AntiCheatDto
{
    public bool PreventTabSwitch { get; set; }
    public bool PreventCopyPaste { get; set; }
    public bool PreventRightClick { get; set; }
    public bool FullscreenRequired { get; set; }
    public int MaxWarnings { get; set; }
}

public class QuestionResponseDto
{
    public int Id { get; set; }
    public int QuizId { get; set; }
    public string Text { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public List<OptionResponseDto> Options { get; set; } = new();
    public string Explanation { get; set; } = string.Empty;
    public string Hint { get; set; } = string.Empty;
    public double Marks { get; set; }
    public double NegativeMark { get; set; }
    public string Difficulty { get; set; } = string.Empty;
    public bool IsAIGenerated { get; set; }
    public int Order { get; set; }
    public int TimesAnswered { get; set; }
    public int TimesCorrect { get; set; }
    public double Accuracy => TimesAnswered > 0 ? Math.Round((double)TimesCorrect / TimesAnswered * 100, 1) : 0;
}

public class OptionResponseDto
{
    public int Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OrderIndex { get; set; }
}
