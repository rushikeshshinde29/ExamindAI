package com.examind.ai.service;

import com.examind.ai.entity.User;
import java.util.Map;

public interface LeaderboardService {
    Map<String, Object> getGlobalLeaderboard(User currentUser);
}
