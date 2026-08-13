using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizMasterPro.API.Data.Models;

public class User
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    // Discriminator: "student" | "faculty" | "admin"
    [Required, MaxLength(20)]
    public string Role { get; set; } = "student";

    public string Avatar { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;

    // Student-specific
    public string StudentId { get; set; } = string.Empty;
    public string EnrollmentYear { get; set; } = string.Empty;
    public string Course { get; set; } = string.Empty;

    // Faculty-specific
    public string EmployeeId { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;

    // Status
    public bool IsActive { get; set; } = true;
    public bool IsEmailVerified { get; set; } = false;
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetExpires { get; set; }
    public DateTime? LastLogin { get; set; }
    public int LoginCount { get; set; } = 0;

    // Gamification (students)
    public int TotalPoints { get; set; } = 0;
    public int Level { get; set; } = 1;
    public int Streak { get; set; } = 0;
    public DateTime? LastAttemptDate { get; set; }

    // Ban
    public bool IsBanned { get; set; } = false;
    public string BanReason { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<UserBadge> Badges { get; set; } = new List<UserBadge>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<Quiz> CreatedQuizzes { get; set; } = new List<Quiz>();
    public ICollection<Attempt> Attempts { get; set; } = new List<Attempt>();
    public ICollection<Certificate> Certificates { get; set; } = new List<Certificate>();
}

public class UserBadge
{
    [Key] public int Id { get; set; }
    public int UserId { get; set; }
    [Required, MaxLength(100)] public string Badge { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public DateTime EarnedAt { get; set; } = DateTime.UtcNow;
    [ForeignKey("UserId")] public User User { get; set; } = null!;
}
