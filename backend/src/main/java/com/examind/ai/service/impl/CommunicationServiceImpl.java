package com.examind.ai.service.impl;

import com.examind.ai.entity.*;
import com.examind.ai.exception.CustomException;
import com.examind.ai.repository.*;
import com.examind.ai.service.CommunicationService;
import com.examind.ai.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class CommunicationServiceImpl implements CommunicationService {

    private static final Logger logger = LoggerFactory.getLogger(CommunicationServiceImpl.class);

    private final QuizRepository quizRepository;
    private final AttemptRepository attemptRepository;
    private final QuizDiscussionRepository quizDiscussionRepository;
    private final UserRepository userRepository;
    private final UserPreferencesRepository userPreferencesRepository;
    private final EmailService emailService;

    public CommunicationServiceImpl(QuizRepository quizRepository,
                                    AttemptRepository attemptRepository,
                                    QuizDiscussionRepository quizDiscussionRepository,
                                    UserRepository userRepository,
                                    UserPreferencesRepository userPreferencesRepository,
                                    EmailService emailService) {
        this.quizRepository = quizRepository;
        this.attemptRepository = attemptRepository;
        this.quizDiscussionRepository = quizDiscussionRepository;
        this.userRepository = userRepository;
        this.userPreferencesRepository = userPreferencesRepository;
        this.emailService = emailService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizDiscussion> getQuizDiscussions(Long id) {
        return quizDiscussionRepository.findByQuizIdOrderByCreatedAtAsc(id);
    }

    @Override
    @Transactional
    public QuizDiscussion addQuizDiscussion(Long id, Map<String, Object> payload, User user) {
        String message = (String) payload.get("message");
        if (message == null || message.isBlank()) {
            throw new CustomException("Message is required", HttpStatus.BAD_REQUEST);
        }
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new CustomException("Quiz not found", HttpStatus.NOT_FOUND));
        
        QuizDiscussion discussion = new QuizDiscussion();
        discussion.setQuiz(quiz);
        discussion.setUser(user);
        discussion.setMessage(message);
        return quizDiscussionRepository.save(discussion);
    }

    @Override
    @Transactional
    public Map<String, Object> shareAttemptResult(Long id, Map<String, Object> payload, User user) {
        String recipientEmail = (String) payload.get("email");
        if (recipientEmail == null || recipientEmail.isBlank()) {
            throw new CustomException("Recipient email is required", HttpStatus.BAD_REQUEST);
        }

        Attempt attempt = attemptRepository.findById(id)
                .orElseThrow(() -> new CustomException("Attempt not found", HttpStatus.NOT_FOUND));

        if (!attempt.getStudent().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized attempt sharing", HttpStatus.FORBIDDEN);
        }

        String[] emailParts = recipientEmail.split("[,;\\s\\n]+");
        List<String> validEmails = new ArrayList<>();
        for (String e : emailParts) {
            String trimmed = e.trim();
            if (!trimmed.isEmpty() && trimmed.contains("@")) {
                validEmails.add(trimmed);
            }
        }

        if (validEmails.isEmpty()) {
            throw new CustomException("No valid recipient emails provided", HttpStatus.BAD_REQUEST);
        }

        int sentCount = 0;
        for (String email : validEmails) {
            try {
                emailService.sendQuizResultShare(
                        email,
                        user.getName(),
                        attempt.getQuiz().getTitle(),
                        attempt.getPercentage(),
                        attempt.getObtainedMarks(),
                        attempt.getTotalMarks(),
                        attempt.isPassed(),
                        attempt.getTimeTaken(),
                        attempt.getWarningCount()
                );
                sentCount++;
                logger.info("Result share email sent to: {}", email);
            } catch (Exception ex) {
                logger.error("Failed to send result share email to {}: {}", email, ex.getMessage());
            }
        }

        if (sentCount == 0) {
            throw new CustomException("Failed to send emails. Check mail configuration.", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return Map.of(
                "success", true,
                "message", "Result shared successfully with " + sentCount + " recipient(s)",
                "sentCount", sentCount
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> shareQuizInvitation(Long id, Map<String, Object> payload, User user) {
        String recipientEmail = (String) payload.get("email");
        if (recipientEmail == null || recipientEmail.isBlank()) {
            throw new CustomException("Recipient email is required", HttpStatus.BAD_REQUEST);
        }

        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new CustomException("Quiz not found", HttpStatus.NOT_FOUND));

        Optional<User> recipientOpt = userRepository.findByEmail(recipientEmail);
        if (recipientOpt.isPresent()) {
            boolean emailEnabled = userPreferencesRepository.findByUserId(recipientOpt.get().getId())
                    .map(UserPreferences::isEmailNotifications)
                    .orElse(true);
            if (!emailEnabled) {
                return Map.of("success", true, "message", "Invitation skipped (user has disabled email notifications)");
            }
        }

        emailService.sendQuizInvitation(
                recipientEmail,
                quiz.getTitle(),
                user.getName(),
                quiz.getSubject() != null ? quiz.getSubject() : "General"
        );

        return Map.of("success", true, "message", "Quiz invitation sent to " + recipientEmail);
    }
}
