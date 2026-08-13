package com.examind.ai.service;

import com.examind.ai.entity.User;
import java.util.Map;

public interface DashboardService {
    Map<String, Object> getFacultyDashboard(User user);
    Map<String, Object> getRecentAttempts(User user);
    Map<String, Object> getStudentDashboard(User user);
}
