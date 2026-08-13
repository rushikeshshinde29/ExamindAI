package com.examind.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "attempt_answers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AttemptAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    @JsonIgnore
    private Attempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "selected_option_index")
    private Integer selectedOptionIndex; // 0-based index of selection

    @Column(name = "is_correct")
    private boolean isCorrect = false;

    @Column(name = "marks_awarded")
    private double marksAwarded = 0.0;

    @Column(name = "time_taken")
    private int timeTaken = 0; // seconds

    private boolean flagged = false;

    @Column(name = "text_answer", columnDefinition = "TEXT")
    private String textAnswer;

    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback;
}
