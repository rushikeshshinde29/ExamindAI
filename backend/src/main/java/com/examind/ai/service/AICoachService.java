package com.examind.ai.service;

import com.examind.ai.entity.User;
import java.util.Map;

public interface AICoachService {
    Map<String, Object> getAICoachData(User student);
    Map<String, Object> getAttemptAIReport(Long attemptId, User user);
}
