using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using QuizMasterPro.API.Data;
using QuizMasterPro.API.Data.Models;
using QuizMasterPro.API.DTOs.Auth;
using QuizMasterPro.API.Helpers;

namespace QuizMasterPro.API.Services;

// ─── AUTH SERVICE ────────────────────────────────────────────────────────────
public class AuthService
{
    private readonly AppDbContext _db;
    private readonly JwtHelper _jwt;
    private readonly EmailService _email;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, JwtHelper jwt, EmailService email, IConfiguration config)
    {
        _db = db; _jwt = jwt; _email = email; _config = config;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        if (dto.Role == "admin")
            return Fail("Cannot self-register as admin");

        if (await _db.Users.AnyAsync(u => u.Email == dto.Email.ToLower()))
            return Fail("Email already registered");

        var user = new User
        {
            Name = dto.Name.Trim(),
            Email = dto.Email.ToLower().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, 12),
            Role = dto.Role,
            Department = dto.Department,
            Phone = dto.Phone,
            StudentId = dto.StudentId,
            EmployeeId = dto.EmployeeId,
            Designation = dto.Designation,
            Course = dto.Course
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return new AuthResponseDto { Success = true, Message = "Registered successfully", Token = _jwt.GenerateToken(user), User = ToDto(user) };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower());

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Fail("Invalid email or password");

        if (!user.IsActive) return Fail("Account deactivated. Contact admin.");
        if (user.IsBanned) return Fail($"Account banned: {user.BanReason}");

        user.LastLogin = DateTime.UtcNow;
        user.LoginCount++;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return new AuthResponseDto { Success = true, Message = "Login successful", Token = _jwt.GenerateToken(user), User = ToDto(user) };
    }

    public async Task<UserDto?> GetMeAsync(int userId)
    {
        var u = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        return u == null ? null : ToDto(u);
    }

    public async Task<AuthResponseDto> UpdateProfileAsync(int userId, UpdateProfileDto dto)
    {
        var u = await _db.Users.FindAsync(userId);
        if (u == null) return Fail("User not found");

        if (!string.IsNullOrWhiteSpace(dto.Name)) u.Name = dto.Name.Trim();
        if (dto.Department != null) u.Department = dto.Department;
        if (dto.Phone != null) u.Phone = dto.Phone;
        if (dto.Bio != null) u.Bio = dto.Bio;
        if (dto.Designation != null) u.Designation = dto.Designation;
        if (dto.Specialization != null) u.Specialization = dto.Specialization;
        if (dto.Course != null) u.Course = dto.Course;
        if (dto.EnrollmentYear != null) u.EnrollmentYear = dto.EnrollmentYear;
        u.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return new AuthResponseDto { Success = true, Message = "Profile updated", User = ToDto(u) };
    }

    public async Task<AuthResponseDto> ChangePasswordAsync(int userId, ChangePasswordDto dto)
    {
        var u = await _db.Users.FindAsync(userId);
        if (u == null) return Fail("User not found");
        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, u.PasswordHash))
            return Fail("Current password is incorrect");
        u.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword, 12);
        u.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return new AuthResponseDto { Success = true, Message = "Password changed successfully" };
    }

    public async Task<AuthResponseDto> ForgotPasswordAsync(string email)
    {
        var u = await _db.Users.FirstOrDefaultAsync(u => u.Email == email.ToLower());
        // Always return the same generic message so we don't reveal whether an email is registered.
        const string genericMsg = "If this email exists, a reset link was sent.";
        if (u == null) return new AuthResponseDto { Success = true, Message = genericMsg };

        u.PasswordResetToken = Guid.NewGuid().ToString("N");
        u.PasswordResetExpires = DateTime.UtcNow.AddHours(1);
        u.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var frontendBase = _config["Frontend:BaseUrl"] ?? "http://localhost:3000";
        var resetUrl = $"{frontendBase.TrimEnd('/')}/reset-password?token={u.PasswordResetToken}";

        var sent = await _email.SendPasswordResetEmailAsync(u.Email, u.Name, u.PasswordResetToken, resetUrl);
        if (!sent)
        {
            // The email genuinely failed to send (bad SMTP config/creds/network) — surface that
            // instead of pretending it worked, so this is debuggable instead of silently swallowed.
            return new AuthResponseDto { Success = false, Message = "Could not send the reset email right now. Please try again in a moment or contact support." };
        }

        return new AuthResponseDto { Success = true, Message = genericMsg };
    }

    public async Task<AuthResponseDto> ResetPasswordAsync(ResetPasswordDto dto)
    {
        var u = await _db.Users.FirstOrDefaultAsync(u =>
            u.PasswordResetToken == dto.Token && u.PasswordResetExpires > DateTime.UtcNow);
        if (u == null) return Fail("Invalid or expired reset token");
        u.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword, 12);
        u.PasswordResetToken = null;
        u.PasswordResetExpires = null;
        u.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return new AuthResponseDto { Success = true, Message = "Password reset successfully" };
    }

    private static AuthResponseDto Fail(string msg) => new() { Success = false, Message = msg };

    public static UserDto ToDto(User u) => new()
    {
        Id = u.Id, Name = u.Name, Email = u.Email, Role = u.Role,
        Avatar = u.Avatar, Department = u.Department, Phone = u.Phone, Bio = u.Bio,
        StudentId = u.StudentId, EmployeeId = u.EmployeeId, Designation = u.Designation,
        Specialization = u.Specialization, Course = u.Course, EnrollmentYear = u.EnrollmentYear,
        IsActive = u.IsActive, IsBanned = u.IsBanned, TotalPoints = u.TotalPoints,
        Level = u.Level, Streak = u.Streak,
        LastLogin = u.LastLogin, CreatedAt = u.CreatedAt
    };
}
