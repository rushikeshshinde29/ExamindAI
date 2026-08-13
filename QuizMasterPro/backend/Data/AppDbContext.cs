using Microsoft.EntityFrameworkCore;
using QuizMasterPro.API.Data.Models;

namespace QuizMasterPro.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<UserBadge> UserBadges { get; set; }
    public DbSet<Quiz> Quizzes { get; set; }
    public DbSet<Question> Questions { get; set; }
    public DbSet<QuestionOption> QuestionOptions { get; set; }
    public DbSet<Attempt> Attempts { get; set; }
    public DbSet<AttemptAnswer> AttemptAnswers { get; set; }
    public DbSet<AntiCheatLog> AntiCheatLogs { get; set; }
    public DbSet<Certificate> Certificates { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasDefaultValue("student");
            e.HasIndex(u => u.Role);
        });

        // Quiz -> CreatedBy (Restrict to avoid cascade issues)
        modelBuilder.Entity<Quiz>()
            .HasOne(q => q.CreatedBy)
            .WithMany(u => u.CreatedQuizzes)
            .HasForeignKey(q => q.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        // Question -> Quiz
        modelBuilder.Entity<Question>()
            .HasOne(q => q.Quiz)
            .WithMany(qz => qz.Questions)
            .HasForeignKey(q => q.QuizId)
            .OnDelete(DeleteBehavior.Cascade);

        // Question -> CreatedBy
        modelBuilder.Entity<Question>()
            .HasOne(q => q.CreatedBy)
            .WithMany()
            .HasForeignKey(q => q.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        // QuestionOption -> Question
        modelBuilder.Entity<QuestionOption>()
            .HasOne(o => o.Question)
            .WithMany(q => q.Options)
            .HasForeignKey(o => o.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        // Attempt -> Quiz
        modelBuilder.Entity<Attempt>()
            .HasOne(a => a.Quiz)
            .WithMany(q => q.Attempts)
            .HasForeignKey(a => a.QuizId)
            .OnDelete(DeleteBehavior.Cascade);

        // Attempt -> Student
        modelBuilder.Entity<Attempt>()
            .HasOne(a => a.Student)
            .WithMany(u => u.Attempts)
            .HasForeignKey(a => a.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        // AttemptAnswer -> Attempt
        modelBuilder.Entity<AttemptAnswer>()
            .HasOne(a => a.Attempt)
            .WithMany(att => att.Answers)
            .HasForeignKey(a => a.AttemptId)
            .OnDelete(DeleteBehavior.Cascade);

        // AttemptAnswer -> Question (NO cascade - avoid multiple paths)
        modelBuilder.Entity<AttemptAnswer>()
            .HasOne(a => a.Question)
            .WithMany(q => q.AttemptAnswers)
            .HasForeignKey(a => a.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);

        // AntiCheatLog -> Attempt
        modelBuilder.Entity<AntiCheatLog>()
            .HasOne(l => l.Attempt)
            .WithMany(a => a.AntiCheatLogs)
            .HasForeignKey(l => l.AttemptId)
            .OnDelete(DeleteBehavior.Cascade);

        // Certificate
        modelBuilder.Entity<Certificate>()
            .HasIndex(c => c.CertificateId).IsUnique();
        modelBuilder.Entity<Certificate>()
            .HasOne(c => c.Attempt).WithMany().HasForeignKey(c => c.AttemptId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Certificate>()
            .HasOne(c => c.Student).WithMany(u => u.Certificates).HasForeignKey(c => c.StudentId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Certificate>()
            .HasOne(c => c.Quiz).WithMany(q => q.Certificates).HasForeignKey(c => c.QuizId).OnDelete(DeleteBehavior.Restrict);

        // Notification -> User
        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // UserBadge -> User
        modelBuilder.Entity<UserBadge>()
            .HasOne(b => b.User)
            .WithMany(u => u.Badges)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Performance indexes
        modelBuilder.Entity<Attempt>().HasIndex(a => new { a.QuizId, a.StudentId });
        modelBuilder.Entity<Attempt>().HasIndex(a => new { a.StudentId, a.CreatedAt });
        modelBuilder.Entity<Attempt>().HasIndex(a => new { a.QuizId, a.Percentage });
        modelBuilder.Entity<Question>().HasIndex(q => new { q.QuizId, q.Order });
        modelBuilder.Entity<Notification>().HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt });

        // Seed Admin
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            Name = "Super Admin",
            Email = "admin@quizmaster.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role = "admin",
            IsActive = true,
            IsEmailVerified = true,
            CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        // Seed Faculty
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 2,
            Name = "Demo Faculty",
            Email = "faculty@demo.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo@123"),
            Role = "faculty",
            IsActive = true,
            IsEmailVerified = true,
            CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        // Seed Student
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 3,
            Name = "Demo Student",
            Email = "student@demo.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo@123"),
            Role = "student",
            IsActive = true,
            IsEmailVerified = true,
            CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
