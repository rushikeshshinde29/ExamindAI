package com.examind.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quizzes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description = "";

    @Column(nullable = false, length = 100)
    private String subject;

    @Column(length = 100)
    private String category = "General";

    @Column(length = 20)
    private String difficulty = "medium"; // easy, medium, hard

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    @JsonIgnore
    private User createdBy;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<Question> questions = new ArrayList<>();

    private int duration = 30; // minutes

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "total_marks")
    private int totalMarks = 0;

    @Column(name = "passing_marks")
    private int passingMarks = 0;

    @Column(name = "is_published")
    @JsonProperty("isPublished")
    private boolean isPublished = false;

    @Column(name = "is_active")
    @JsonProperty("isActive")
    private boolean isActive = true;

    @Column(name = "access_code", length = 50)
    private String accessCode = "";

    @Column(name = "max_attempts")
    private int maxAttempts = 1;

    @Column(name = "shuffle_questions")
    private boolean shuffleQuestions = false;

    @Column(name = "shuffle_options")
    private boolean shuffleOptions = false;

    @Column(name = "show_results")
    private boolean showResults = true;

    @Column(name = "show_answers_after")
    private boolean showAnswersAfter = true;

    @Column(columnDefinition = "TEXT")
    private String instructions = "";

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "quiz_tags", joinColumns = @JoinColumn(name = "quiz_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    @Column(name = "attempt_count")
    private int attemptCount = 0;

    @Column(name = "average_score")
    private double averageScore = 0.0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_group_id")
    @JsonIgnore
    private Group targetGroup;

    @Column(name = "publish_at")
    private LocalDateTime publishAt;

    @Column(name = "randomize_count")
    private Integer randomizeCount;

    @Column(name = "is_approved")
    private boolean isApproved = true;

    @Column(name = "exam_mode")
    private boolean examMode = false;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<QuizSection> sections = new ArrayList<>();

    // Anti-cheat Configuration
    @Column(name = "prevent_tab_switch")
    private boolean preventTabSwitch = true;

    @Column(name = "prevent_copy_paste")
    private boolean preventCopyPaste = true;

    @Column(name = "prevent_right_click")
    private boolean preventRightClick = true;

    @Column(name = "fullscreen_required")
    private boolean fullscreenRequired = false;

    @Column(name = "max_warnings")
    private int maxWarnings = 3;

    // Certificate settings
    @Column(name = "certificate_enabled")
    private boolean certificateEnabled = false;

    @Column(name = "certificate_min_score")
    private int certificateMinScore = 80;

    // Gamification & Feedback
    @Column(name = "leaderboard_enabled")
    private boolean leaderboardEnabled = true;

    @Column(name = "feedback_enabled")
    private boolean feedbackEnabled = true;

    @Column(name = "points_on_pass")
    private int pointsOnPass = 10;

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

    @JsonProperty("isPublished")
    public boolean isPublished() {
        return isPublished;
    }

    @JsonProperty("isActive")
    public boolean isActive() {
        return isActive;
    }

    @JsonProperty("antiCheat")
    public java.util.Map<String, Object> getAntiCheat() {
        return java.util.Map.of(
            "preventTabSwitch", preventTabSwitch,
            "preventCopyPaste", preventCopyPaste,
            "preventRightClick", preventRightClick,
            "fullscreenRequired", fullscreenRequired,
            "maxWarnings", maxWarnings
        );
    }

    @JsonProperty("createdBy")
    public java.util.Map<String, Object> getCreatedByForJson() {
        if (createdBy == null) return null;
        try {
            return java.util.Map.of(
                "id", createdBy.getId(),
                "name", createdBy.getName() != null ? createdBy.getName() : ""
            );
        } catch (Exception e) {
            return null;
        }
    }
}
