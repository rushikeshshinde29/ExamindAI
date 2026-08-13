package com.examind.ai.service;

import com.examind.ai.entity.User;
import java.util.Map;

public interface AnalyticsService {
    Map<String, Object> getQuizAnalytics(Long quizId, User user);
    Map<String, Object> getStudentAnalytics(User user);
}
