package com.examind.ai.service.impl;

import com.examind.ai.dto.response.UserDto;
import com.examind.ai.entity.User;
import com.examind.ai.exception.CustomException;
import com.examind.ai.repository.AttemptRepository;
import com.examind.ai.repository.UserRepository;
import com.examind.ai.service.LeaderboardService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LeaderboardServiceImpl implements LeaderboardService {

    private final UserRepository userRepository;
    private final AttemptRepository attemptRepository;

    public LeaderboardServiceImpl(UserRepository userRepository, AttemptRepository attemptRepository) {
        this.userRepository = userRepository;
        this.attemptRepository = attemptRepository;
    }

    @Override
    public Map<String, Object> getGlobalLeaderboard(User currentUser) {
        if (currentUser == null) throw new CustomException("Not authenticated", HttpStatus.UNAUTHORIZED);

        List<User> topStudents = userRepository.findFilteredUsers(
                "student", "active", null,
                PageRequest.of(0, 50, Sort.by("totalPoints").descending())
        ).getContent();

        List<UserDto> dtos = topStudents.stream().map(UserDto::fromEntity).collect(Collectors.toList());

        int myRank = -1;
        for (int i = 0; i < dtos.size(); i++) {
            if (dtos.get(i).getId().equals(currentUser.getId())) {
                myRank = i + 1;
                break;
            }
        }
        if (myRank == -1 && "student".equals(currentUser.getRole())) {
            long betterCount = attemptRepository.countBetterStudentsGlobally(currentUser.getTotalPoints());
            myRank = (int) (betterCount + 1);
        }

        return Map.of("data", dtos, "myRank", myRank);
    }
}
