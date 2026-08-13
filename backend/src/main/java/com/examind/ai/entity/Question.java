package com.examind.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    @JsonIgnore
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    @JsonIgnore
    private QuizSection section;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(nullable = false, length = 50)
    private String type = "mcq"; // mcq, true_false, multi_select

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<QuestionOption> options = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String explanation = "";

    @Column(columnDefinition = "TEXT")
    private String hint = "";

    private double marks = 1.0;

    @Column(name = "negative_mark")
    private double negativeMark = 0.0;

    @Column(length = 20)
    private String difficulty = "medium"; // easy, medium, hard

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "question_tags", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    @JsonIgnore
    private User createdBy;

    @Column(name = "is_ai_generated")
    private boolean isAIGenerated = false;

    @Column(name = "question_order")
    private int order = 0;

    @Column(name = "image_url", length = 255)
    private String imageUrl = "";

    @Column(name = "video_url")
    private String videoUrl = "";

    // Analytics
    @Column(name = "times_answered")
    private int timesAnswered = 0;

    @Column(name = "times_correct")
    private int timesCorrect = 0;

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

    @com.fasterxml.jackson.annotation.JsonProperty("sectionId")
    public Long getSectionIdVal() {
        return section != null ? section.getId() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("sectionTitle")
    public String getSectionTitleVal() {
        return section != null ? section.getTitle() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("quizId")
    public Long getQuizIdVal() {
        return quiz != null ? quiz.getId() : null;
    }
}

