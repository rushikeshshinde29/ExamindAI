package com.examind.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Attempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnore
    private User student;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AttemptAnswer> answers = new ArrayList<>();

    @Column(name = "total_marks")
    private double totalMarks = 0.0;

    @Column(name = "obtained_marks")
    private double obtainedMarks = 0.0;

    private double percentage = 0.0;

    @Column(name = "is_passed")
    private Boolean isPassed = false;

    public boolean isPassed() {
        return isPassed != null && isPassed;
    }

    public void setPassed(boolean passed) {
        this.isPassed = passed;
    }

    @Column(nullable = false, length = 30)
    private String status = "in_progress"; // in_progress, completed, timed_out, disqualified

    @Column(name = "start_time")
    private LocalDateTime startTime = LocalDateTime.now();

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "time_taken")
    private int timeTaken = 0; // seconds

    @Column(name = "attempt_number")
    private int attemptNumber = 1;

    // List of Question IDs to preserve order when randomized
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "attempt_questions_order", joinColumns = @JoinColumn(name = "attempt_id"))
    @Column(name = "question_id")
    @OrderColumn(name = "list_index")
    private List<Long> questionsOrder = new ArrayList<>();

    // Proctoring & Anti-cheat logs
    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AttemptAntiCheatLog> antiCheatLog = new ArrayList<>();

    @Column(name = "warning_count")
    private int warningCount = 0;

    @Column(name = "is_disqualified")
    private Boolean isDisqualified = false;

    public boolean isDisqualified() {
        return isDisqualified != null && isDisqualified;
    }

    public void setDisqualified(boolean disqualified) {
        this.isDisqualified = disqualified;
    }

    @Column(name = "disqualification_reason", length = 255)

    private String disqualificationReason = "";


    @Column(name = "user_agent", length = 255)
    private String userAgent = "";

    @Column(name = "ip_address", length = 50)
    private String ipAddress = "";

    @Column(name = "focus_lost_count")
    private int focusLostCount = 0;

    // Gamification
    @Column(name = "points_earned")
    private int pointsEarned = 0;

    @Column(name = "rank_position")
    private int rankPosition = 0;

    // Student feedback
    private Integer rating; // 1 to 5

    @Column(name = "feedback_comment", columnDefinition = "TEXT")
    private String feedbackComment = "";

    @Column(name = "feedback_submitted_at")
    private LocalDateTime feedbackSubmittedAt;

    // Certificates
    @Column(name = "certificate_issued")
    private boolean certificateIssued = false;

    @Column(name = "certificate_id", length = 100)
    private String certificateId = "";

    @Column(name = "proctoring_video_url", length = 512)
    private String proctoringVideoUrl;

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
