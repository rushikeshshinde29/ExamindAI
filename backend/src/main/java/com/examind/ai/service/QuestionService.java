package com.examind.ai.service;

import com.examind.ai.dto.request.QuestionCreateRequest;
import com.examind.ai.entity.Question;
import com.examind.ai.entity.User;

public interface QuestionService {
    Question updateQuestion(Long id, QuestionCreateRequest request, User user);
}
