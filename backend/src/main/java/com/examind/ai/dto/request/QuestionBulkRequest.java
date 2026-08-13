package com.examind.ai.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class QuestionBulkRequest {

    @NotNull(message = "Quiz ID is required")
    private Long quizId;

    private List<QuestionCreateRequest> questions;
}
