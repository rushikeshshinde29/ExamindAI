package com.examind.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonProperty;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuestionOptionDto {

    @NotBlank(message = "Option text is required")
    private String text;

    @JsonProperty("isCorrect")
    private boolean isCorrect = false;
}
