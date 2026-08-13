package com.examind.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 255)
    @JsonIgnore
    private String password;

    @Column(nullable = false, length = 20)
    private String role; // admin, faculty, student

    @Column(length = 255)
    private String avatar = "";

    @Column(length = 100)
    private String department = "";

    @Column(name = "student_id", length = 100)
    private String studentId = "";

    @Column(name = "employee_id", length = 100)
    private String employeeId = "";

    @Column(columnDefinition = "TEXT")
    private String bio = "";

    @Column(length = 20)
    private String phone = "";

    @Column(length = 50)
    private String semester = "";

    @Column(length = 50)
    private String division = "";

    @Column(name = "is_active")
    private Boolean isActive = true;

    public boolean isActive() {
        return isActive != null && isActive;
    }

    public void setActive(boolean active) {
        this.isActive = active;
    }

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "login_count")
    private Integer loginCount = 0;

    @Column(name = "is_banned")
    private Boolean isBanned = false;

    public boolean isBanned() {
        return isBanned != null && isBanned;
    }

    public void setBanned(boolean banned) {
        this.isBanned = banned;
    }

    @Column(name = "ban_reason", length = 255)
    private String banReason = "";



    @Column(name = "otp_code", length = 6)
    private String otpCode;

    @Column(name = "otp_expiry")
    private LocalDateTime otpExpiry;

    @Column(name = "email_verified")
    private Boolean emailVerified = false;

    public boolean isEmailVerified() {
        return emailVerified != null && emailVerified;
    }


    @Column(name = "password_reset_token", length = 100)
    private String passwordResetToken;

    @Column(name = "password_reset_expiry")
    private LocalDateTime passwordResetExpiry;

    @Column(name = "suspicious_activity_count")
    private Integer suspiciousActivityCount = 0;
    // Gamification
    @Column(name = "total_points")
    private Integer totalPoints = 0;

    private Integer level = 1;

    private Integer streak = 0;



    @JsonProperty("isPro")
    @Column(name = "is_pro")
    private Boolean isPro = false;

    public boolean isPro() {
        return isPro != null && isPro;
    }

    public void setPro(Boolean pro) {
        this.isPro = pro;
    }

    @Column(name = "last_attempt_date")
    private LocalDateTime lastAttemptDate;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_badges", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "badge")
    private List<String> badges = new ArrayList<>();

    // Preferences
    @Column(name = "preferences_email_notifications")
    private boolean emailNotifications = true;

    @Column(name = "preferences_theme", length = 20)
    private String theme = "light";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
