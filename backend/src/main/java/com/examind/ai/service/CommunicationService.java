package com.examind.ai.service;

import com.examind.ai.entity.QuizDiscussion;
import com.examind.ai.entity.User;
import java.util.List;
import java.util.Map;

public interface CommunicationService {
    List<QuizDiscussion> getQuizDiscussions(Long id);
    QuizDiscussion addQuizDiscussion(Long id, Map<String, Object> payload, User user);
    Map<String, Object> shareAttemptResult(Long id, Map<String, Object> payload, User user);
    Map<String, Object> shareQuizInvitation(Long id, Map<String, Object> payload, User user);
}
