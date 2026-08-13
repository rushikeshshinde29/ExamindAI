package com.examind.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "login_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ip_address", nullable = false, unique = true, length = 50)
    private String ipAddress;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount = 0;

    @Column(name = "last_attempt_at", nullable = false)
    private LocalDateTime lastAttemptAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastAttemptAt = LocalDateTime.now();
    }
}
