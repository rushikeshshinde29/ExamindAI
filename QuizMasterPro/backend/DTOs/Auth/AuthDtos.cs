using System.ComponentModel.DataAnnotations;

namespace QuizMasterPro.API.DTOs.Auth;

public class RegisterDto
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

public class LoginDto
{
    [Required, EmailAddress] public string Email { get; set; } = string.Empty;
    [Required] public string Password { get; set; } = string.Empty;
}

public class ForgotPasswordDto
{
    [Required, EmailAddress] public string Email { get; set; } = string.Empty;
}

public class ResetPasswordDto
{
    [Required] public string Token { get; set; } = string.Empty;
    [Required, MinLength(6)] public string NewPassword { get; set; } = string.Empty;
}

public class UpdateProfileDto
{
    public string? Name { get; set; }
    public string? Department { get; set; }
    public string? Phone { get; set; }
    public string? Bio { get; set; }
    public string? Designation { get; set; }
    public string? Specialization { get; set; }
    public string? Course { get; set; }
    public string? EnrollmentYear { get; set; }
}

public class ChangePasswordDto
{
    [Required] public string CurrentPassword { get; set; } = string.Empty;
    [Required, MinLength(6)] public string NewPassword { get; set; } = string.Empty;
}

public class UserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string Course { get; set; } = string.Empty;
    public string EnrollmentYear { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsBanned { get; set; }
    public int TotalPoints { get; set; }
    public int Level { get; set; }
    public int Streak { get; set; }
    public DateTime? LastLogin { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AuthResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Token { get; set; }
    public UserDto? User { get; set; }
}
