package com.examind.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_discussions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuizDiscussion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    @JsonIgnore
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    // Add custom helper getters to serialize user fields directly in JSON
    @com.fasterxml.jackson.annotation.JsonProperty("userName")
    public String getUserNameVal() {
        return user != null ? user.getName() : "Anonymous";
    }

    @com.fasterxml.jackson.annotation.JsonProperty("userRole")
    public String getUserRoleVal() {
        return user != null ? user.getRole() : "student";
    }
}
