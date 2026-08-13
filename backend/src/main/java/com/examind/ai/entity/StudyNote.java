package com.examind.ai.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "study_notes")
@Getter @Setter
public class StudyNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    @JsonIgnore
    private Question question;

    @Column(nullable = false, length = 2000)
    private String content;

    private String title = "";
    private String subject = "";
    private String color = "#fff9c4"; // sticky note color

    @Column(name = "is_flashcard")
    private boolean flashcard = false;

    // Flashcard front/back
    @Column(name = "flashcard_front", length = 1000)
    private String flashcardFront = "";

    @Column(name = "flashcard_back", length = 1000)
    private String flashcardBack = "";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = LocalDateTime.now(); }
}
