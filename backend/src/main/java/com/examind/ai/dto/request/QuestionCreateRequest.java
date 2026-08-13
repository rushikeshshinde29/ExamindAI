package com.examind.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class QuestionCreateRequest {

    @NotBlank(message = "Question text is required")
    private String text;

    private Long quizId;

    private String type = "mcq"; // mcq, true_false, multi_select

    @NotEmpty(message = "Question options are required")
    private List<QuestionOptionDto> options;

    private String explanation = "";

    private String hint = "";

    private double marks = 1.0;

    private double negativeMark = 0.0;

    private String difficulty = "medium"; // easy, medium, hard

    private List<String> tags;

    private int order = 0;

    private String imageUrl = "";

    private Long sectionId;
}

