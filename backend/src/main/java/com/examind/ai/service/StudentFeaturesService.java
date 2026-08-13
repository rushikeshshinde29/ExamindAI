package com.examind.ai.service;

import com.examind.ai.entity.User;
import java.util.List;
import java.util.Map;

public interface StudentFeaturesService {
    Map<String, Object> getPercentileRank(User user);
    List<Map<String, Object>> getMasteryScores(User user);
    Map<String, Object> getHeatmap(User user);
    Map<String, Object> getQuizComparison(Long quizId, User user);
    Map<String, Object> getStudentProfile(Long userId);
    Map<String, Object> getEngagementScore(User user);
}
