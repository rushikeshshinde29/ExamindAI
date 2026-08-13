package com.examind.ai.dto.request;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class AttemptSubmitRequest {
    private List<AnswerSubmitDto> answers;
    private int timeTaken; // seconds
}
