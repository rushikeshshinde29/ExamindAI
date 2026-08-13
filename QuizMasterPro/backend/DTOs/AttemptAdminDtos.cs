using System.ComponentModel.DataAnnotations;

namespace QuizMasterPro.API.DTOs.Attempt
{
    public class StartAttemptDto
    {
        [Required] public int QuizId { get; set; }
        public string AccessCode { get; set; } = string.Empty;
    }

    public class SubmitAttemptDto
    {
        [Required] public List<AnswerDto> Answers { get; set; } = new();
        public int TimeTaken { get; set; } = 0;
    }

    public class AnswerDto
    {
        public int QuestionId { get; set; }
        public int? SelectedOption { get; set; }
        public int TimeTaken { get; set; } = 0;
        public bool Flagged { get; set; } = false;
    }

    public class AntiCheatEventDto
    {
        [Required] public string Event { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
    }

    public class FeedbackDto
    {
        [Range(1, 5)] public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
    }

    public class AttemptResponseDto
    {
        public int Id { get; set; }
        public int QuizId { get; set; }
        public string QuizTitle { get; set; } = string.Empty;
        public string QuizSubject { get; set; } = string.Empty;
        public string QuizDifficulty { get; set; } = string.Empty;
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public double TotalMarks { get; set; }
        public double ObtainedMarks { get; set; }
        public double Percentage { get; set; }
        public bool IsPassed { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int TimeTaken { get; set; }
        public int AttemptNumber { get; set; }
        public int WarningCount { get; set; }
        public bool IsDisqualified { get; set; }
        public int PointsEarned { get; set; }
        public int Rank { get; set; }
        public bool CertificateIssued { get; set; }
        public string CertificateId { get; set; } = string.Empty;
        public List<AttemptAnswerDto> Answers { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    public class AttemptAnswerDto
    {
        public int QuestionId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public int? SelectedOption { get; set; }
        public bool IsCorrect { get; set; }
        public double MarksAwarded { get; set; }
        public bool Flagged { get; set; }
        public List<OptionInfoDto> Options { get; set; } = new();
    }

    public class OptionInfoDto
    {
        public string Text { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
    }
}

namespace QuizMasterPro.API.DTOs.Admin
{
    public class CreateUserDto
    {
        [Required, MaxLength(100)] public string Name { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MinLength(6)] public string Password { get; set; } = string.Empty;
        [Required] public string Role { get; set; } = "student";
        public string Department { get; set; } = string.Empty;
        public string StudentId { get; set; } = string.Empty;
        public string EmployeeId { get; set; } = string.Empty;
        public string Designation { get; set; } = string.Empty;
        public string Course { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
    }

    public class UpdateUserStatusDto
    {
        public bool? IsActive { get; set; }
        public bool? IsBanned { get; set; }
        public string BanReason { get; set; } = string.Empty;
    }

    public class DashboardStatsDto
    {
        public int TotalStudents { get; set; }
        public int TotalFaculty { get; set; }
        public int TotalQuizzes { get; set; }
        public int PublishedQuizzes { get; set; }
        public int TotalAttempts { get; set; }
        public int TotalCertificates { get; set; }
        public double OverallPassRate { get; set; }
        public double AverageScore { get; set; }
        public List<RecentActivityDto> RecentActivity { get; set; } = new();
        public List<TopQuizDto> TopQuizzes { get; set; } = new();
        public List<TopStudentDto> TopStudents { get; set; } = new();
    }

    public class RecentActivityDto
    {
        public string Type { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class TopQuizDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public int AttemptCount { get; set; }
        public double AverageScore { get; set; }
    }

    public class TopStudentDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int TotalPoints { get; set; }
        public int Level { get; set; }
        public string Department { get; set; } = string.Empty;
    }
}
