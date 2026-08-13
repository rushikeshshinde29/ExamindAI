package com.examind.ai.service.impl;

import com.examind.ai.entity.*;
import com.examind.ai.repository.*;
import com.examind.ai.service.DashboardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardService {

    private static final Logger logger = LoggerFactory.getLogger(DashboardServiceImpl.class);

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final AttemptRepository attemptRepository;

    public DashboardServiceImpl(QuizRepository quizRepository,
                                QuestionRepository questionRepository,
                                AttemptRepository attemptRepository) {
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.attemptRepository = attemptRepository;
    }

    @Override
    public Map<String, Object> getFacultyDashboard(User user) {
        logger.info("Loading faculty dashboard for: {}", user.getEmail());

        List<Quiz> myQuizzes = quizRepository.findByCreatedById(user.getId());
        List<Long> myQuizIds = myQuizzes.stream().map(Quiz::getId).collect(Collectors.toList());

        long totalQuizzes = myQuizzes.size();
        long publishedQuizzes = myQuizzes.stream().filter(Quiz::isPublished).count();
        long totalQuestions = questionRepository.countByCreatedById(user.getId());

        List<Attempt> recentAttempts = myQuizIds.isEmpty() ? new ArrayList<>()
                : attemptRepository.findCompletedAttemptsForQuizzes(myQuizIds);

        List<Map<String, Object>> recentAttemptsList = recentAttempts.stream()
                .sorted(Comparator.comparing(Attempt::getCreatedAt).reversed())
                .limit(10)
                .map(a -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("_id", a.getId());
                    map.put("percentage", a.getPercentage());
                    map.put("isPassed", a.isPassed());
                    map.put("createdAt", a.getCreatedAt());
                    map.put("status", a.getStatus());
                    if (a.getStudent() != null) {
                        map.put("student", Map.of("name", a.getStudent().getName(), "email", a.getStudent().getEmail()));
                    }
                    if (a.getQuiz() != null) {
                        map.put("quiz", Map.of("title", a.getQuiz().getTitle(), "subject", a.getQuiz().getSubject()));
                    }
                    return map;
                }).collect(Collectors.toList());

        // Top quizzes — compute stats live from attempts table (3NF compliant)
        List<Map<String, Object>> topQuizzesList = myQuizzes.stream()
                .map(q -> {
                    long count = attemptRepository.countByQuizId(q.getId());
                    List<Attempt> completed = attemptRepository.findCompletedByQuizId(q.getId());
                    double avg = completed.isEmpty() ? 0.0
                            : completed.stream().mapToDouble(Attempt::getPercentage).average().orElse(0.0);
                    Map<String, Object> map = new HashMap<>();
                    map.put("_id", q.getId());
                    map.put("title", q.getTitle());
                    map.put("subject", q.getSubject());
                    map.put("attemptCount", count);
                    map.put("averageScore", avg);
                    map.put("isPublished", q.isPublished());
                    map.put("_sortKey", count);
                    return map;
                })
                .sorted(Comparator.comparingLong(m -> -((Long) m.get("_sortKey"))))
                .limit(5)
                .peek(m -> m.remove("_sortKey"))
                .collect(Collectors.toList());

        long totalUniqueStudents = recentAttempts.stream()
                .map(a -> a.getStudent().getId()).distinct().count();
        long totalAttempts = recentAttempts.size();
        long passCount = recentAttempts.stream().filter(Attempt::isPassed).count();
        double passRate = totalAttempts > 0 ? ((double) passCount / totalAttempts) * 100.0 : 0.0;

        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<LocalDateTime> weeklyDates = myQuizIds.isEmpty() ? new ArrayList<>()
                : attemptRepository.findCompletedDatesForQuizzes(myQuizIds, sevenDaysAgo);

        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("E", Locale.ENGLISH);
        Map<String, Long> dayCounts = weeklyDates.stream()
                .map(dt -> dt.format(dayFormatter))
                .collect(Collectors.groupingBy(f -> f, Collectors.counting()));

        List<Map<String, Object>> weeklyTrend = dayCounts.entrySet().stream()
                .map(entry -> Map.of("_id", (Object) entry.getKey(), "count", (Object) entry.getValue()))
                .collect(Collectors.toList());

        Map<String, Object> data = new HashMap<>();
        data.put("totalQuizzes", totalQuizzes);
        data.put("publishedQuizzes", publishedQuizzes);
        data.put("totalQuestions", totalQuestions);
        data.put("totalAttempts", totalAttempts);
        data.put("totalStudents", totalUniqueStudents);
        data.put("passRate", String.format("%.1f", passRate));
        data.put("recentAttempts", recentAttemptsList);
        data.put("topQuizzes", topQuizzesList);
        data.put("weeklyTrend", weeklyTrend);
        return data;
    }

    @Override
    public Map<String, Object> getRecentAttempts(User user) {
        List<Quiz> myQuizzes = quizRepository.findByCreatedById(user.getId());
        List<Long> myQuizIds = myQuizzes.stream().map(Quiz::getId).collect(Collectors.toList());
        List<Attempt> recentAttempts = myQuizIds.isEmpty() ? new ArrayList<>()
                : attemptRepository.findCompletedAttemptsForQuizzes(myQuizIds);

        List<Map<String, Object>> list = recentAttempts.stream().map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("percentage", a.getPercentage());
            map.put("isPassed", a.isPassed());
            map.put("createdAt", a.getCreatedAt());
            map.put("obtainedMarks", a.getObtainedMarks());
            map.put("totalMarks", a.getTotalMarks());
            if (a.getStudent() != null) {
                map.put("student", Map.of("name", a.getStudent().getName(), "email", a.getStudent().getEmail()));
            }
            if (a.getQuiz() != null) {
                map.put("quiz", Map.of("title", a.getQuiz().getTitle(), "subject", a.getQuiz().getSubject()));
            }
            return map;
        }).collect(Collectors.toList());

        return Map.of("data", list);
    }

    @Override
    public Map<String, Object> getStudentDashboard(User user) {
        logger.info("Loading student dashboard for: {}", user.getEmail());

        List<Attempt> attempts = attemptRepository.findByStudentIdAndStatus(user.getId(), "completed");
        long availableQuizzes = quizRepository.countByIsPublishedTrue();
        long totalAttempts = attempts.size();

        double avgScore = 0.0;
        long passCount = 0;
        if (totalAttempts > 0) {
            avgScore = attempts.stream().mapToDouble(Attempt::getPercentage).average().orElse(0.0);
            passCount = attempts.stream().filter(Attempt::isPassed).count();
        }

        long betterStudentsCount = attemptRepository.countBetterStudentsGlobally(user.getTotalPoints());
        int globalRank = (int) (betterStudentsCount + 1);

        List<Map<String, Object>> recentAttemptsList = attempts.stream()
                .sorted(Comparator.comparing(Attempt::getCreatedAt).reversed())
                .limit(6)
                .map(a -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("_id", a.getId());
                    map.put("percentage", a.getPercentage());
                    map.put("isPassed", a.isPassed());
                    map.put("createdAt", a.getCreatedAt());
                    map.put("status", a.getStatus());
                    if (a.getQuiz() != null) {
                        map.put("quiz", Map.of(
                            "title", a.getQuiz().getTitle(),
                            "subject", a.getQuiz().getSubject(),
                            "difficulty", a.getQuiz().getDifficulty(),
                            "totalMarks", a.getQuiz().getTotalMarks(),
                            "passingMarks", a.getQuiz().getPassingMarks()
                        ));
                    }
                    return map;
                }).collect(Collectors.toList());

        Map<String, Object> data = new HashMap<>();
        data.put("totalAttempts", totalAttempts);
        data.put("averageScore", String.format("%.1f", avgScore));
        data.put("passCount", passCount);
        data.put("availableQuizzes", availableQuizzes);
        data.put("totalPoints", user.getTotalPoints());
        data.put("level", user.getLevel());
        data.put("streak", user.getStreak());
        data.put("badges", user.getBadges());
        data.put("globalRank", globalRank);
        data.put("recentAttempts", recentAttemptsList);
        return data;
    }
}
