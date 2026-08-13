package com.examind.ai.service;

import com.examind.ai.dto.request.AntiCheatLogRequest;
import com.examind.ai.dto.request.AttemptSubmitRequest;
import com.examind.ai.entity.Attempt;
import com.examind.ai.entity.User;
import java.util.List;
import java.util.Map;

public interface AttemptService {
    Attempt startAttempt(Long quizId, String accessCode, User student, String userAgent, String ipAddress);
    Attempt startRevisionAttempt(Long quizId, Long previousAttemptId, User student, String userAgent, String ipAddress);
    Map<String, Object> logAntiCheatEvent(Long attemptId, AntiCheatLogRequest request, User student);
    Attempt submitAttempt(Long attemptId, AttemptSubmitRequest request, User student);
    List<Attempt> getMyAttempts(User student);
    Attempt getAttempt(Long id, User user);
    Attempt submitFeedback(Long attemptId, int rating, String comment, User student);
    String uploadProctoringVideo(Long attemptId, org.springframework.web.multipart.MultipartFile file);
}

