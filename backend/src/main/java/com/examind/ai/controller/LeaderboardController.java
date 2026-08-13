package com.examind.ai.controller;

import com.examind.ai.entity.User;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.LeaderboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getLeaderboardFallback(@AuthenticationPrincipal UserDetails userDetails) {
        return getGlobalLeaderboard(userDetails);
    }

    @GetMapping("/global")
    public ResponseEntity<Map<String, Object>> getGlobalLeaderboard(@AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> result = leaderboardService.getGlobalLeaderboard(user);
        return ResponseEntity.ok(Map.of("success", true, "data", result.get("data"), "myRank", result.get("myRank")));
    }
}
