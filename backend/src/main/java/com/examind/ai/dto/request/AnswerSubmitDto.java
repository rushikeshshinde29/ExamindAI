package com.examind.ai.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnswerSubmitDto {

    @NotNull(message = "Question ID is required")
    private Long questionId;

    private Integer selectedOption; // index (nullable for un-answered/skipped)

    private int timeTaken; // seconds spent on this question

    private boolean flagged = false;

    private String textAnswer;
}
