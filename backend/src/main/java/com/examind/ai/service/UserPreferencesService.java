package com.examind.ai.service;

import com.examind.ai.entity.User;
import com.examind.ai.entity.UserPreferences;
import java.util.Map;

public interface UserPreferencesService {
    UserPreferences getPreferences(User user);
    UserPreferences updatePreferences(User user, Map<String, Object> body);
}
