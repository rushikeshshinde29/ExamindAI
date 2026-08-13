package com.examind.ai.service.impl;

import com.examind.ai.entity.*;
import com.examind.ai.exception.CustomException;
import com.examind.ai.repository.*;
import com.examind.ai.service.AnalyticsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsServiceImpl implements AnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(AnalyticsServiceImpl.class);

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final AttemptRepository attemptRepository;

    public AnalyticsServiceImpl(QuizRepository quizRepository,
                                QuestionRepository questionRepository,
                                AttemptRepository attemptRepository) {
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.attemptRepository = attemptRepository;
    }

    @Override
    public Map<String, Object> getQuizAnalytics(Long quizId, User user) {
        logger.info("Loading analytics for quiz ID: {} by: {}", quizId, user.getEmail());

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new CustomException("Quiz not found", HttpStatus.NOT_FOUND));

        if (!user.getRole().equals("admin") && !quiz.getCreatedBy().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized analytics access", HttpStatus.FORBIDDEN);
        }

        List<Attempt> attempts = attemptRepository.findCompletedByQuizId(quizId);
        List<Question> questions = questionRepository.findByQuizIdOrderByOrderAsc(quizId);

        // Per-question stats
        List<Map<String, Object>> questionStats = questions.stream().map(q -> {
            List<AttemptAnswer> qAnswers = attempts.stream()
                    .flatMap(a -> a.getAnswers().stream())
                    .filter(ans -> ans.getQuestion().getId().equals(q.getId()))
                    .collect(Collectors.toList());
            long total = qAnswers.size();
            long correct = qAnswers.stream().filter(AttemptAnswer::isCorrect).count();
            double accuracy = total > 0 ? ((double) correct / total) * 100.0 : 0.0;
            double avgTime = total > 0 ? qAnswers.stream().mapToDouble(AttemptAnswer::getTimeTaken).average().orElse(0.0) : 0.0;
            Map<String, Object> map = new HashMap<>();
            map.put("_id", q.getId());
            map.put("text", q.getText().length() > 80 ? q.getText().substring(0, 80) + "..." : q.getText());
            map.put("accuracy", String.format("%.1f", accuracy));
            map.put("totalAnswered", total);
            map.put("correct", correct);
            map.put("difficulty", q.getDifficulty());
            map.put("avgTime", Math.round(avgTime));
            return map;
        }).collect(Collectors.toList());

        // Score distribution
        int[] buckets = new int[5];
        for (Attempt a : attempts) {
            double pct = a.getPercentage();
            if (pct <= 20) buckets[0]++;
            else if (pct <= 40) buckets[1]++;
            else if (pct <= 60) buckets[2]++;
            else if (pct <= 80) buckets[3]++;
            else buckets[4]++;
        }
        List<Map<String, Object>> scoreDistribution = List.of(
                Map.of("range", "0-20", "count", buckets[0]),
                Map.of("range", "21-40", "count", buckets[1]),
                Map.of("range", "41-60", "count", buckets[2]),
                Map.of("range", "61-80", "count", buckets[3]),
                Map.of("range", "81-100", "count", buckets[4])
        );

        // Anti-cheat
        int warnings = attempts.stream().mapToInt(Attempt::getWarningCount).sum();
        long disqualified = attempts.stream().filter(Attempt::isDisqualified).count();
        int focusLost = attempts.stream().mapToInt(Attempt::getFocusLostCount).sum();
        long tabSwitches = attempts.stream()
                .flatMap(a -> a.getAntiCheatLog().stream())
                .filter(l -> l.getEvent().equalsIgnoreCase("tab_switch"))
                .count();
        Map<String, Object> antiCheatStats = Map.of(
                "warnings", warnings,
                "disqualified", disqualified,
                "tabSwitches", tabSwitches,
                "focusLost", focusLost
        );

        // Summary
        int totalAttempts = attempts.size();
        long passedCount = attempts.stream().filter(Attempt::isPassed).count();
        double avgScore = totalAttempts > 0 ? attempts.stream().mapToDouble(Attempt::getPercentage).average().orElse(0.0) : 0.0;
        double avgTime = totalAttempts > 0 ? attempts.stream().mapToDouble(Attempt::getTimeTaken).average().orElse(0.0) / 60.0 : 0.0;
        double highest = totalAttempts > 0 ? attempts.stream().mapToDouble(Attempt::getPercentage).max().orElse(0.0) : 0.0;
        double lowest = totalAttempts > 0 ? attempts.stream().mapToDouble(Attempt::getPercentage).min().orElse(0.0) : 0.0;

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalAttempts", totalAttempts);
        summary.put("passCount", passedCount);
        summary.put("avgScore", String.format("%.1f", avgScore));
        summary.put("avgTime", String.format("%.1f", avgTime));
        summary.put("highestScore", String.format("%.1f", highest));
        summary.put("lowestScore", String.format("%.1f", lowest));

        // Time series
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        Map<String, List<Attempt>> groupedByDate = attempts.stream()
                .filter(a -> a.getCreatedAt().isAfter(thirtyDaysAgo))
                .collect(Collectors.groupingBy(a -> a.getCreatedAt().toLocalDate().toString()));

        List<Map<String, Object>> timeSeries = groupedByDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    List<Attempt> list = entry.getValue();
                    double avgScoreForDay = list.stream().mapToDouble(Attempt::getPercentage).average().orElse(0.0);
                    return Map.<String, Object>of(
                            "_id", entry.getKey(),
                            "count", list.size(),
                            "avgScore", Math.round(avgScoreForDay)
                    );
                }).collect(Collectors.toList());

        Map<String, Object> data = new HashMap<>();
        data.put("summary", summary);
        data.put("questionStats", questionStats);
        data.put("scoreDistribution", scoreDistribution);
        data.put("timeSeries", timeSeries);
        data.put("antiCheatStats", antiCheatStats);

        return data;
    }

    @Override
    public Map<String, Object> getStudentAnalytics(User user) {
        logger.info("Loading personal analytics for student: {}", user.getEmail());

        List<Attempt> attempts = attemptRepository.findByStudentIdAndStatus(user.getId(), "completed");

        // Subject breakdown
        Map<String, List<Attempt>> bySubject = attempts.stream()
                .filter(a -> a.getQuiz() != null)
                .collect(Collectors.groupingBy(a -> a.getQuiz().getSubject()));

        List<Map<String, Object>> subjectStats = bySubject.entrySet().stream().map(entry -> {
            String subject = entry.getKey();
            List<Attempt> list = entry.getValue();
            double avgScoreSubject = list.stream().mapToDouble(Attempt::getPercentage).average().orElse(0.0);
            long passed = list.stream().filter(Attempt::isPassed).count();
            double passRateSubject = list.size() > 0 ? ((double) passed / list.size()) * 100.0 : 0.0;
            Map<String, Object> map = new HashMap<>();
            map.put("subject", subject);
            map.put("attempts", list.size());
            map.put("avgScore", String.format("%.1f", avgScoreSubject));
            map.put("passRate", Math.round(passRateSubject));
            return map;
        }).collect(Collectors.toList());

        // Recent 10 trend
        List<Map<String, Object>> recentTrend = new ArrayList<>();
        List<Attempt> sortedAttempts = attempts.stream()
                .sorted(Comparator.comparing(Attempt::getCreatedAt))
                .collect(Collectors.toList());
        int limit = Math.min(10, sortedAttempts.size());
        for (int i = 0; i < limit; i++) {
            Attempt a = sortedAttempts.get(sortedAttempts.size() - limit + i);
            recentTrend.add(Map.of(
                    "index", i + 1,
                    "score", a.getPercentage(),
                    "date", a.getCreatedAt().toLocalDate().toString()
            ));
        }

        int total = attempts.size();
        long passedCount = attempts.stream().filter(Attempt::isPassed).count();
        double passRate = total > 0 ? ((double) passedCount / total) * 100.0 : 0.0;
        double avgScore = total > 0 ? attempts.stream().mapToDouble(Attempt::getPercentage).average().orElse(0.0) : 0.0;

        Map<String, Object> data = new HashMap<>();
        data.put("totalAttempts", total);
        data.put("passRate", String.format("%.1f", passRate));
        data.put("avgScore", String.format("%.1f", avgScore));
        data.put("totalPoints", user.getTotalPoints() != null ? user.getTotalPoints() : 0);
        data.put("level", user.getLevel() != null ? user.getLevel() : 1);
        data.put("streak", user.getStreak() != null ? user.getStreak() : 0);
        data.put("badges", user.getBadges());
        data.put("subjectStats", subjectStats);
        data.put("recentTrend", recentTrend);

        return data;
    }
}