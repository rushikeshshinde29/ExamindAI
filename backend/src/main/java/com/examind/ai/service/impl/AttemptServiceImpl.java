package com.examind.ai.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.examind.ai.dto.request.AnswerSubmitDto;
import com.examind.ai.dto.request.AntiCheatLogRequest;
import com.examind.ai.dto.request.AttemptSubmitRequest;
import com.examind.ai.entity.*;
import com.examind.ai.exception.CustomException;
import com.examind.ai.repository.*;
import com.examind.ai.service.AttemptService;
import com.examind.ai.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class AttemptServiceImpl implements AttemptService {

    private static final Logger logger = LoggerFactory.getLogger(AttemptServiceImpl.class);

    // Delegated to AIService

    @org.springframework.beans.factory.annotation.Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @org.springframework.beans.factory.annotation.Value("${cloudinary.api-key:}")
    private String apiKey;

    @org.springframework.beans.factory.annotation.Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @org.springframework.beans.factory.annotation.Value("${cloudinary.url:}")
    private String cloudinaryUrl;

    private final AttemptRepository attemptRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final UserPreferencesRepository userPreferencesRepository;
    private final EmailService emailService;
    private final com.examind.ai.service.AIService aiService;

    public AttemptServiceImpl(AttemptRepository attemptRepository,
                              QuizRepository quizRepository,
                              QuestionRepository questionRepository,
                              UserRepository userRepository,
                              NotificationRepository notificationRepository,
                              UserPreferencesRepository userPreferencesRepository,
                              EmailService emailService,
                              com.examind.ai.service.AIService aiService) {
        this.attemptRepository = attemptRepository;
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.userPreferencesRepository = userPreferencesRepository;
        this.emailService = emailService;
        this.aiService = aiService;
    }


    @Override
    public Attempt startAttempt(Long quizId, String accessCode, User student, String userAgent, String ipAddress) {
        logger.info("Student: {} starting quiz ID: {}", student.getEmail(), quizId);
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new CustomException("Quiz not found", HttpStatus.NOT_FOUND));

        if (!quiz.isPublished() || !quiz.isActive()) {
            throw new CustomException("Quiz is not active or published", HttpStatus.BAD_REQUEST);
        }

        // Access code verification
        if (quiz.getAccessCode() != null && !quiz.getAccessCode().isBlank() && !quiz.getAccessCode().equals(accessCode)) {
            throw new CustomException("Invalid access code", HttpStatus.FORBIDDEN);
        }

        // Check if student has already completed max attempts
        long completedCount = attemptRepository.countByQuizIdAndStudentIdAndStatusIn(
                quizId, student.getId(), List.of("completed", "timed_out", "disqualified"));
        
        if (completedCount >= quiz.getMaxAttempts()) {
            throw new CustomException("Maximum " + quiz.getMaxAttempts() + " attempt(s) allowed", HttpStatus.BAD_REQUEST);
        }

        // Check if there is an active in-progress attempt to resume
        Optional<Attempt> activeOpt = attemptRepository.findFirstByQuizIdAndStudentIdAndStatus(quizId, student.getId(), "in_progress");
        if (activeOpt.isPresent()) {
            logger.info("Resuming active attempt ID: {}", activeOpt.get().getId());
            return activeOpt.get();
        }

        // Configure questions order
        List<Long> questionIds = quiz.getQuestions().stream().map(Question::getId).collect(Collectors.toList());
        if (quiz.isShuffleQuestions()) {
            Collections.shuffle(questionIds);
        }

        // Randomization pool logic
        if (quiz.getRandomizeCount() != null && quiz.getRandomizeCount() > 0) {
            if (!quiz.isShuffleQuestions()) {
                Collections.shuffle(questionIds);
            }
            int limit = Math.min(quiz.getRandomizeCount(), questionIds.size());
            questionIds = new ArrayList<>(questionIds.subList(0, limit));
            
            if (!quiz.isShuffleQuestions()) {
                final List<Long> finalIds = questionIds;
                List<Question> origOrdered = quiz.getQuestions().stream()
                        .filter(q -> finalIds.contains(q.getId()))
                        .collect(Collectors.toList());
                questionIds = origOrdered.stream().map(Question::getId).collect(Collectors.toList());
            }
        }

        Attempt attempt = new Attempt();
        attempt.setQuiz(quiz);
        attempt.setStudent(student);
        attempt.setTotalMarks(quiz.getTotalMarks());
        attempt.setAttemptNumber((int) (completedCount + 1));
        attempt.setQuestionsOrder(questionIds);
        attempt.setUserAgent(userAgent != null ? userAgent : "");
        attempt.setIpAddress(ipAddress != null ? ipAddress : "");

        Attempt saved = attemptRepository.save(attempt);
        recalculateQuizStats(quiz);
        return saved;
    }

    @Override
    public Attempt startRevisionAttempt(Long quizId, Long previousAttemptId, User student, String userAgent, String ipAddress) {
        logger.info("Student: {} starting revision quiz ID: {}, previous attempt ID: {}", student.getEmail(), quizId, previousAttemptId);
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new CustomException("Quiz not found", HttpStatus.NOT_FOUND));

        if (!quiz.isPublished() || !quiz.isActive()) {
            throw new CustomException("Quiz is not active or published", HttpStatus.BAD_REQUEST);
        }

        Attempt previousAttempt = attemptRepository.findById(previousAttemptId)
                .orElseThrow(() -> new CustomException("Previous attempt not found", HttpStatus.NOT_FOUND));

        if (!previousAttempt.getStudent().getId().equals(student.getId())) {
            throw new CustomException("Unauthorized access to previous attempt", HttpStatus.FORBIDDEN);
        }

        List<Long> correctQuestionIds = previousAttempt.getAnswers().stream()
                .filter(AttemptAnswer::isCorrect)
                .map(ans -> ans.getQuestion().getId())
                .collect(Collectors.toList());

        List<Long> wrongQuestionIds = new ArrayList<>();
        for (Long qId : previousAttempt.getQuestionsOrder()) {
            if (!correctQuestionIds.contains(qId)) {
                wrongQuestionIds.add(qId);
            }
        }

        if (wrongQuestionIds.isEmpty()) {
            throw new CustomException("You got all questions correct in the previous attempt! No revision needed.", HttpStatus.BAD_REQUEST);
        }

        long completedCount = attemptRepository.countByQuizIdAndStudentIdAndStatusIn(
                quizId, student.getId(), List.of("completed", "timed_out", "disqualified"));

        Optional<Attempt> activeOpt = attemptRepository.findFirstByQuizIdAndStudentIdAndStatus(quizId, student.getId(), "in_progress");
        activeOpt.ifPresent(activeAttempt -> {
            activeAttempt.setStatus("abandoned");
            attemptRepository.save(activeAttempt);
        });

        Attempt attempt = new Attempt();
        attempt.setQuiz(quiz);
        attempt.setStudent(student);
        attempt.setTotalMarks(quiz.getTotalMarks());
        attempt.setAttemptNumber((int) (completedCount + 1));
        attempt.setQuestionsOrder(wrongQuestionIds);
        attempt.setUserAgent(userAgent != null ? userAgent : "");
        attempt.setIpAddress(ipAddress != null ? ipAddress : "");

        Attempt saved = attemptRepository.save(attempt);
        recalculateQuizStats(quiz);
        return saved;
    }


    @Override
    public Map<String, Object> logAntiCheatEvent(Long attemptId, AntiCheatLogRequest request, User student) {
        logger.info("Logging anti-cheat warning for attempt ID: {}, event: {}", attemptId, request.getEvent());
        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new CustomException("Attempt not found", HttpStatus.NOT_FOUND));

        if (!attempt.getStudent().getId().equals(student.getId())) {
            throw new CustomException("Unauthorized access to this attempt", HttpStatus.FORBIDDEN);
        }

        if (!attempt.getStatus().equals("in_progress")) {
            throw new CustomException("Attempt is not active", HttpStatus.BAD_REQUEST);
        }

        AttemptAntiCheatLog log = new AttemptAntiCheatLog();
        log.setAttempt(attempt);
        log.setEvent(request.getEvent());
        log.setDetails(request.getDetails());
        log.setTimestamp(LocalDateTime.now());
        attempt.getAntiCheatLog().add(log);

        // Check if event increments warnings
        String ev = request.getEvent();
        if (List.of("tab_switch", "copy_attempt", "right_click", "fullscreen_exit").contains(ev)) {
            attempt.setWarningCount(attempt.getWarningCount() + 1);
            if (ev.equals("tab_switch") || ev.equals("fullscreen_exit")) {
                attempt.setFocusLostCount(attempt.getFocusLostCount() + 1);
            }
        }

        // Automatic disqualification check
        Quiz quiz = attempt.getQuiz();
        if (quiz != null && attempt.getWarningCount() >= quiz.getMaxWarnings()) {
            attempt.setStatus("disqualified");
            attempt.setDisqualified(true);
            attempt.setDisqualificationReason("Exceeded " + quiz.getMaxWarnings() + " warnings");
            logger.warn("Attempt ID: {} disqualified due to proctoring breaches", attemptId);
        }

        Attempt saved = attemptRepository.save(attempt);
        return Map.of("success", true, "warningCount", saved.getWarningCount(), "disqualified", saved.isDisqualified());
    }

    @Override
    public Attempt submitAttempt(Long attemptId, AttemptSubmitRequest request, User student) {
        logger.info("Submitting quiz attempt ID: {}", attemptId);
        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new CustomException("Attempt not found", HttpStatus.NOT_FOUND));

        if (!attempt.getStudent().getId().equals(student.getId())) {
            throw new CustomException("Unauthorized submit access", HttpStatus.FORBIDDEN);
        }

        if (!attempt.getStatus().equals("in_progress") && !attempt.getStatus().equals("disqualified")) {
            throw new CustomException("Attempt is not active", HttpStatus.BAD_REQUEST);
        }

        Quiz quiz = attempt.getQuiz();
        List<Question> questions = quiz.getQuestions();

        double obtainedMarks = 0.0;
        List<AttemptAnswer> answers = new ArrayList<>();

        if (request.getAnswers() != null) {
            for (AnswerSubmitDto ansDto : request.getAnswers()) {
                Question q = questions.stream().filter(ques -> ques.getId().equals(ansDto.getQuestionId())).findFirst().orElse(null);
                if (q == null) continue;

                AttemptAnswer ans = new AttemptAnswer();
                ans.setAttempt(attempt);
                ans.setQuestion(q);
                ans.setSelectedOptionIndex(ansDto.getSelectedOption());
                ans.setTimeTaken(ansDto.getTimeTaken());
                ans.setFlagged(ansDto.isFlagged());

                // Calculate correctness
                boolean isCorrect = false;
                if (q.getType() != null && q.getType().equalsIgnoreCase("short_answer")) {
                    ans.setTextAnswer(ansDto.getTextAnswer());
                    if (ansDto.getTextAnswer() != null && !ansDto.getTextAnswer().isBlank()) {
                        String gradingPrompt = "You are an automated exam grader. Evaluate the student's text response for the following question:\n" +
                                "Question: \"" + q.getText() + "\"\n" +
                                "Reference Answer / Criteria: \"" + (q.getExplanation() != null ? q.getExplanation() : "") + "\"\n" +
                                "Student Response: \"" + ansDto.getTextAnswer() + "\"\n" +
                                "\n" +
                                "Grade the response. Respond ONLY with a valid JSON object. No markdown backticks, no markdown json tags, no additional explanations. Use this exact structure:\n" +
                                "{\n" +
                                "  \"score\": 0.8,\n" +
                                "  \"isCorrect\": true,\n" +
                                "  \"feedback\": \"Good attempt, covered key points but missed X.\"\n" +
                                "}";

                        double scoreFraction = 0.0;
                        String aiFeedbackText = "No response submitted.";
                        try {
                            String gradingRes = callAI(gradingPrompt);
                            String cleanGradingRes = aiService.cleanAIResponseText(gradingRes);
                            Map<String, Object> gradingMap = new com.fasterxml.jackson.databind.ObjectMapper()
                                    .readValue(cleanGradingRes, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
                            
                            scoreFraction = ((Number) gradingMap.get("score")).doubleValue();
                            isCorrect = (Boolean) gradingMap.get("isCorrect");
                            aiFeedbackText = (String) gradingMap.get("feedback");
                        } catch (Exception ex) {
                            logger.error("Failed to grade short answer with AI", ex);
                            aiFeedbackText = "AI auto-grading failed: " + ex.getMessage();
                            scoreFraction = 0.0;
                            isCorrect = false;
                        }

                        double awarded = scoreFraction * q.getMarks();
                        ans.setMarksAwarded(awarded);
                        ans.setCorrect(isCorrect);
                        ans.setAiFeedback(aiFeedbackText);
                        obtainedMarks += awarded;
                    } else {
                        ans.setMarksAwarded(0.0);
                        ans.setCorrect(false);
                        ans.setAiFeedback("No response submitted.");
                    }
                } else {
                    List<QuestionOption> opts = q.getOptions();
                    if (q.getType() != null && q.getType().equalsIgnoreCase("multi_select")) {
                        int correctBitmask = 0;
                        for (int i = 0; i < opts.size(); i++) {
                            if (opts.get(i).isCorrect()) {
                                correctBitmask |= (1 << i);
                            }
                        }
                        if (ansDto.getSelectedOption() != null && ansDto.getSelectedOption() == correctBitmask) {
                            isCorrect = true;
                            ans.setMarksAwarded(q.getMarks());
                            obtainedMarks += q.getMarks();
                        } else {
                            double penalty = q.getNegativeMark();
                            ans.setMarksAwarded(-penalty);
                            obtainedMarks -= penalty;
                        }
                    } else {
                        int correctIdx = -1;
                        for (int i = 0; i < opts.size(); i++) {
                            if (opts.get(i).isCorrect()) {
                                correctIdx = i;
                                break;
                            }
                        }
                        if (ansDto.getSelectedOption() != null && ansDto.getSelectedOption() == correctIdx) {
                            isCorrect = true;
                            ans.setMarksAwarded(q.getMarks());
                            obtainedMarks += q.getMarks();
                        } else {
                            double penalty = q.getNegativeMark();
                            ans.setMarksAwarded(-penalty);
                            obtainedMarks -= penalty;
                        }
                    }
                    ans.setCorrect(isCorrect);
                }
                answers.add(ans);


                // Update Question Analytics
                q.setTimesAnswered(q.getTimesAnswered() + 1);
                if (isCorrect) {
                    q.setTimesCorrect(q.getTimesCorrect() + 1);
                }
                questionRepository.save(q);
            }
        }

        obtainedMarks = Math.max(0.0, obtainedMarks);
        double percentage = 0.0;
        if (quiz.getTotalMarks() > 0) {
            percentage = (obtainedMarks / quiz.getTotalMarks()) * 100.0;
            // Round to 2 decimal places
            percentage = Math.round(percentage * 100.0) / 100.0;
        }

        boolean isPassed = obtainedMarks >= quiz.getPassingMarks();

        // Calculate Global Rank Position in this quiz
        long betterAttemptsCount = attemptRepository.countBetterAttemptsInQuiz(quiz.getId(), percentage);
        int rank = (int) (betterAttemptsCount + 1);

        // Points System
        int pointsEarned = 0;
        if (isPassed) {
            pointsEarned = (int) (Math.round(percentage / 10.0) * 5 + quiz.getPointsOnPass());
        }

        attempt.getAnswers().addAll(answers);
        attempt.setEndTime(LocalDateTime.now());
        attempt.setTimeTaken(request.getTimeTaken());

        if (attempt.isDisqualified() || "disqualified".equals(attempt.getStatus())) {
            attempt.setObtainedMarks(0.0);
            attempt.setPercentage(0.0);
            attempt.setPassed(false);
            attempt.setStatus("disqualified");
            attempt.setPointsEarned(0);
        } else {
            attempt.setObtainedMarks(obtainedMarks);
            attempt.setPercentage(percentage);
            attempt.setPassed(isPassed);
            attempt.setStatus("completed");
            attempt.setRankPosition(rank);
            attempt.setPointsEarned(pointsEarned);
        }

        // If certificate enabled and student passed
        if (quiz.isCertificateEnabled() && percentage >= quiz.getCertificateMinScore()) {
            // Find other completed attempts for this student and quiz to determine previous best
            List<Attempt> otherAttempts = attemptRepository.findByStudentIdAndQuizIdAndStatus(student.getId(), quiz.getId(), "completed");
            
            double maxPreviousPercentage = 0.0;
            Attempt previousBestAttempt = null;
            
            for (Attempt a : otherAttempts) {
                if (a.isCertificateIssued() && a.getPercentage() > maxPreviousPercentage) {
                    maxPreviousPercentage = a.getPercentage();
                    previousBestAttempt = a;
                }
            }
            
            if (percentage > maxPreviousPercentage) {
                // Current attempt is the new best! Issue certificate to this one.
                attempt.setCertificateIssued(true);
                attempt.setCertificateId(UUID.randomUUID().toString());
                
                // Revoke previous best certificate if one existed
                if (previousBestAttempt != null) {
                    previousBestAttempt.setCertificateIssued(false);
                    previousBestAttempt.setCertificateId(null);
                    attemptRepository.save(previousBestAttempt);
                }
            } else {
                // Current attempt did not beat the previous best.
                attempt.setCertificateIssued(false);
                attempt.setCertificateId(null);
            }
        } else {
            attempt.setCertificateIssued(false);
            attempt.setCertificateId(null);
        }

        Attempt savedAttempt = attemptRepository.save(attempt);

        // Update student points, level, and streak
        User user = userRepository.findById(student.getId()).orElse(student);
        user.setTotalPoints(user.getTotalPoints() + pointsEarned);
        user.setLevel((user.getTotalPoints() / 100) + 1);

        // Streak check
        LocalDate today = LocalDate.now();
        if (user.getLastAttemptDate() != null) {
            LocalDate lastDate = user.getLastAttemptDate().toLocalDate();
            if (lastDate.equals(today.minusDays(1))) {
                user.setStreak(user.getStreak() + 1);
            } else if (!lastDate.equals(today)) {
                user.setStreak(1);
            }
        } else {
            user.setStreak(1);
        }
        user.setLastAttemptDate(LocalDateTime.now());

        // Process Badge Rules
        long totalCompletedAttempts = attemptRepository.countByStudentIdAndStatus(user.getId(), "completed");
        checkAndAwardBadges(user, totalCompletedAttempts, percentage);

        userRepository.save(user);

        // Push submission and certificate notifications
        Notification submissionNotif = new Notification();
        submissionNotif.setUser(user);
        if (savedAttempt.isDisqualified() || "disqualified".equals(savedAttempt.getStatus())) {
            submissionNotif.setTitle("Quiz Disqualified ⚠️");
            submissionNotif.setMessage("You were disqualified from \"" + quiz.getTitle() + "\" due to proctoring breaches.");
            submissionNotif.setType("disqualification");
            submissionNotif.setIcon("⚠️");
        } else {
            submissionNotif.setTitle("Quiz Submitted! 📊");
            submissionNotif.setMessage("You scored " + (int) percentage + "% on \"" + quiz.getTitle() + "\"");
            submissionNotif.setType("result_ready");
            submissionNotif.setIcon("📊");
        }
        submissionNotif.setLink("/student/result/" + savedAttempt.getId());
        notificationRepository.save(submissionNotif);

        if (savedAttempt.isCertificateIssued()) {
            Notification certNotif = new Notification();
            certNotif.setUser(user);
            certNotif.setTitle("Certificate Earned! 📜");
            certNotif.setMessage("Congratulations! You earned a certificate for \"" + quiz.getTitle() + "\".");
            certNotif.setType("badge_earned");
            certNotif.setIcon("📜");
            notificationRepository.save(certNotif);
        }

        // Send email results confirmation if student has email notifications enabled
        try {
            boolean emailEnabled = userPreferencesRepository.findByUserId(user.getId())
                    .map(UserPreferences::isEmailNotifications)
                    .orElse(true);
            if (emailEnabled && !savedAttempt.isDisqualified()) {
                emailService.sendQuizResultConfirmation(
                    user.getEmail(),
                    user.getName(),
                    quiz.getTitle(),
                    percentage,
                    obtainedMarks,
                    quiz.getTotalMarks(),
                    isPassed,
                    rank,
                    pointsEarned
                );
            }
        } catch (Exception ex) {
            logger.error("Failed to send quiz results confirmation email to {}", user.getEmail(), ex);
        }

        // Recalculate Quiz average score stats
        recalculateQuizStats(quiz);

        return savedAttempt;
    }

    @Override
    public List<Attempt> getMyAttempts(User student) {
        logger.info("Loading attempts list for student: {}", student.getEmail());
        return attemptRepository.findByStudentIdOrderByCreatedAtDesc(student.getId());
    }

    @Override
    public Attempt getAttempt(Long id, User user) {
        logger.info("Loading details for attempt ID: {}", id);
        Attempt attempt = attemptRepository.findById(id)
                .orElseThrow(() -> new CustomException("Attempt not found", HttpStatus.NOT_FOUND));

        if (user.getRole().equals("student") && !attempt.getStudent().getId().equals(user.getId())) {
            throw new CustomException("Access denied to this attempt", HttpStatus.FORBIDDEN);
        }

        return attempt;
    }

    @Override
    public Attempt submitFeedback(Long attemptId, int rating, String comment, User student) {
        logger.info("Submitting feedback for attempt ID: {}, rating={}", attemptId, rating);
        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new CustomException("Attempt not found", HttpStatus.NOT_FOUND));

        if (!attempt.getStudent().getId().equals(student.getId())) {
            throw new CustomException("Unauthorized feedback submission", HttpStatus.FORBIDDEN);
        }

        if (!attempt.getStatus().equals("completed")) {
            throw new CustomException("Feedback can only be submitted for completed attempts", HttpStatus.BAD_REQUEST);
        }

        if (attempt.getRating() != null && attempt.getRating() > 0) {
            throw new CustomException("Feedback has already been submitted for this attempt", HttpStatus.BAD_REQUEST);
        }

        attempt.setRating(rating);
        attempt.setFeedbackComment(comment != null ? comment : "");
        attempt.setFeedbackSubmittedAt(LocalDateTime.now());

        return attemptRepository.save(attempt);
    }

    private void checkAndAwardBadges(User user, long count, double pct) {
        // rules:
        // first_quiz -> count == 1
        // quiz_10 -> count == 10
        // perfect_score -> pct == 100
        // streak_3 -> streak >= 3
        // streak_7 -> streak >= 7
        
        awardBadgeIfEligible(user, "first_quiz", "🎯 First Quiz", count == 1);
        awardBadgeIfEligible(user, "quiz_10", "📚 Quiz Enthusiast", count == 10);
        awardBadgeIfEligible(user, "perfect_score", "💯 Perfect Score", pct == 100.0);
        awardBadgeIfEligible(user, "streak_3", "🔥 3-Day Streak", user.getStreak() >= 3);
        awardBadgeIfEligible(user, "streak_7", "⚡ Week Warrior", user.getStreak() >= 7);
    }

    private void awardBadgeIfEligible(User user, String badgeId, String badgeLabel, boolean condition) {
        if (condition && !user.getBadges().contains(badgeId)) {
            user.getBadges().add(badgeId);
            
            Notification notif = new Notification();
            notif.setUser(user);
            notif.setTitle("Badge Earned! 🏆");
            notif.setMessage("You earned the \"" + badgeLabel + "\" badge!");
            notif.setType("badge_earned");
            notif.setIcon("🏆");
            notificationRepository.save(notif);
            logger.info("Student {} earned badge: {}", user.getEmail(), badgeLabel);
        }
    }

    private void recalculateQuizStats(Quiz quiz) {
        List<Attempt> completedList = attemptRepository.findCompletedByQuizId(quiz.getId());
        long totalAttemptsCount = attemptRepository.countByQuizId(quiz.getId());
        quiz.setAttemptCount((int) totalAttemptsCount);
        if (!completedList.isEmpty()) {
            double sum = completedList.stream().mapToDouble(Attempt::getPercentage).sum();
            quiz.setAverageScore(sum / completedList.size());
        }
        quizRepository.save(quiz);
    }

    @Override
    public String uploadProctoringVideo(Long attemptId, org.springframework.web.multipart.MultipartFile file) {
        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new CustomException("Attempt not found", HttpStatus.NOT_FOUND));

        String proctoringVideoUrl = null;

        // 1. Try Cloudinary
        Cloudinary cloudinary = null;
        if (cloudinaryUrl != null && !cloudinaryUrl.isBlank() && !cloudinaryUrl.contains("dummy")) {
            cloudinary = new Cloudinary(cloudinaryUrl);
        } else if (cloudName != null && !cloudName.isBlank() && apiKey != null && !apiKey.isBlank() && apiSecret != null && !apiSecret.isBlank()) {
            cloudinary = new Cloudinary(Map.of(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret
            ));
        }

        if (cloudinary != null) {
            try {
                logger.info("Uploading proctoring video for attempt ID: {} to Cloudinary...", attemptId);
                Map uploadResult = cloudinary.uploader().upload(file.getBytes(), Map.of(
                    "resource_type", "video",
                    "folder", "quiz_recordings"
                ));

                String secureUrl = (String) uploadResult.get("secure_url");
                if (secureUrl != null) {
                    proctoringVideoUrl = secureUrl;
                    logger.info("Successfully uploaded proctoring video to Cloudinary: {}", secureUrl);
                }
            } catch (Exception e) {
                logger.error("Cloudinary upload failed for attempt {}: {}. Falling back to local storage.", attemptId, e);
            }
        }

        // 2. Fallback: Local Storage
        if (proctoringVideoUrl == null) {
            try {
                String originalFileName = file.getOriginalFilename();
                String extension = ".webm";
                if (originalFileName != null && originalFileName.contains(".")) {
                    extension = originalFileName.substring(originalFileName.lastIndexOf("."));
                }
                String fileName = "proctoring_" + attemptId + "_" + UUID.randomUUID().toString() + extension;
                
                java.nio.file.Path fileStorageLocation = java.nio.file.Paths.get("uploads").toAbsolutePath().normalize();
                java.nio.file.Files.createDirectories(fileStorageLocation);
                
                java.nio.file.Path targetLocation = fileStorageLocation.resolve(fileName);
                java.nio.file.Files.copy(file.getInputStream(), targetLocation, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                
                proctoringVideoUrl = "/api/uploads/" + fileName;
                logger.info("Successfully stored proctoring video locally: {}", proctoringVideoUrl);
            } catch (Exception e) {
                logger.error("Local storage fallback failed for attempt {}", attemptId, e);
                throw new CustomException("Failed to store proctoring video locally: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        attempt.setProctoringVideoUrl(proctoringVideoUrl);
        attemptRepository.save(attempt);
        return proctoringVideoUrl;
    }

    public String callAI(String prompt) {
        return aiService.callAI(prompt);
    }
}
