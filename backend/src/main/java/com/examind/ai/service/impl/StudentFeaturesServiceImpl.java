package com.examind.ai.service.impl;

import com.examind.ai.entity.*;
import com.examind.ai.exception.CustomException;
import com.examind.ai.repository.AttemptRepository;
import com.examind.ai.repository.UserRepository;
import com.examind.ai.service.StudentFeaturesService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StudentFeaturesServiceImpl implements StudentFeaturesService {

    private final AttemptRepository attemptRepository;
    private final UserRepository userRepository;

    public StudentFeaturesServiceImpl(AttemptRepository attemptRepository, UserRepository userRepository) {
        this.attemptRepository = attemptRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Map<String, Object> getPercentileRank(User user) {
        long totalStudents = userRepository.countByRole("student");
        long studentsWithLessPoints = userRepository
            .countByRoleAndTotalPointsLessThan("student", user.getTotalPoints());

        double percentile = totalStudents > 1
                ? (double) studentsWithLessPoints / (totalStudents - 1) * 100.0 : 100.0;
        percentile = Math.round(percentile * 10.0) / 10.0;
        long rank = totalStudents - studentsWithLessPoints;

        Map<String, Object> data = new HashMap<>();
        data.put("percentile", percentile);
        data.put("rank", rank);
        data.put("totalStudents", totalStudents);
        data.put("totalPoints", user.getTotalPoints());
        data.put("message", "You are in the top " + String.format("%.1f", 100 - percentile) + "% of students!");

        return data;
    }

    @Override
    public List<Map<String, Object>> getMasteryScores(User user) {
        List<Attempt> attempts = attemptRepository.findByStudentIdAndStatus(user.getId(), "completed");

        Map<String, List<Attempt>> bySubject = new HashMap<>();
        for (Attempt a : attempts) {
            if (a.getQuiz() != null && a.getQuiz().getSubject() != null) {
                bySubject.computeIfAbsent(a.getQuiz().getSubject(), k -> new ArrayList<>()).add(a);
            }
        }

        List<Map<String, Object>> masteryScores = new ArrayList<>();
        for (Map.Entry<String, List<Attempt>> entry : bySubject.entrySet()) {
            List<Attempt> subAttempts = entry.getValue();
            double totalWeight = 0, weightedScore = 0;
            for (int i = 0; i < subAttempts.size(); i++) {
                double weight = i + 1.0;
                weightedScore += subAttempts.get(i).getPercentage() * weight;
                totalWeight += weight;
            }
            double mastery = totalWeight > 0 ? weightedScore / totalWeight : 0;
            mastery = Math.min(100, Math.round(mastery * 10.0) / 10.0);
            long passed = subAttempts.stream().filter(Attempt::isPassed).count();

            Map<String, Object> m = new HashMap<>();
            m.put("subject", entry.getKey());
            m.put("masteryScore", mastery);
            m.put("totalAttempts", subAttempts.size());
            m.put("passed", passed);
            m.put("level", getMasteryLevel(mastery));
            masteryScores.add(m);
        }
        masteryScores.sort((a, b) -> Double.compare(
            ((Number) b.get("masteryScore")).doubleValue(),
            ((Number) a.get("masteryScore")).doubleValue()));

        return masteryScores;
    }

    @Override
    public Map<String, Object> getHeatmap(User user) {
        LocalDateTime oneYearAgo = LocalDateTime.now().minusDays(365);

        List<Attempt> attempts = attemptRepository
            .findByStudentIdOrderByCreatedAtDesc(user.getId()).stream()
            .filter(a -> a.getCreatedAt().isAfter(oneYearAgo))
            .collect(Collectors.toList());

        Map<String, Long> heatmapData = new HashMap<>();
        for (Attempt a : attempts) {
            String date = a.getCreatedAt().toLocalDate().toString();
            heatmapData.merge(date, 1L, Long::sum);
        }

        List<Map<String, Object>> calendar = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = 364; i >= 0; i--) {
            String date = today.minusDays(i).toString();
            long count = heatmapData.getOrDefault(date, 0L);
            int intensity = count == 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;
            Map<String, Object> day = new HashMap<>();
            day.put("date", date);
            day.put("count", count);
            day.put("intensity", intensity);
            calendar.add(day);
        }

        long activeDays = heatmapData.values().stream().filter(v -> v > 0).count();
        long maxInDay = heatmapData.values().stream().mapToLong(v -> v).max().orElse(0);

        Map<String, Object> data = new HashMap<>();
        data.put("calendar", calendar);
        data.put("totalAttempts", attempts.size());
        data.put("activeDays", activeDays);
        data.put("maxInDay", maxInDay);
        data.put("currentStreak", user.getStreak());

        return data;
    }

    @Override
    public Map<String, Object> getQuizComparison(Long quizId, User user) {
        List<Attempt> allAttempts = attemptRepository.findCompletedByQuizId(quizId);

        if (allAttempts.isEmpty()) {
            throw new CustomException("No attempts found for this quiz", HttpStatus.NOT_FOUND);
        }

        double classAvg = allAttempts.stream()
            .mapToDouble(Attempt::getPercentage).average().orElse(0);
        double classTop = allAttempts.stream()
            .mapToDouble(Attempt::getPercentage).max().orElse(0);
        double classLow = allAttempts.stream()
            .mapToDouble(Attempt::getPercentage).min().orElse(0);

        double myScore = allAttempts.stream()
            .filter(a -> a.getStudent().getId().equals(user.getId()))
            .mapToDouble(Attempt::getPercentage).max().orElse(-1);

        Map<Long, Double> avgByStudent = new HashMap<>();
        for (Attempt a : allAttempts) {
            avgByStudent.merge(a.getStudent().getId(), a.getPercentage(),
                (old, n) -> Math.max(old, n));
        }
        long myRank = avgByStudent.values().stream()
            .filter(v -> v > myScore).count() + 1;

        Map<String, Object> data = new HashMap<>();
        data.put("myScore", myScore);
        data.put("classAverage", Math.round(classAvg * 10.0) / 10.0);
        data.put("classTopper", classTop);
        data.put("classLowest", classLow);
        data.put("myRank", myRank);
        data.put("totalStudents", avgByStudent.size());
        data.put("aboveAverage", myScore >= classAvg);

        return data;
    }

    @Override
    public Map<String, Object> getStudentProfile(Long userId) {
        User student = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("Student not found", HttpStatus.NOT_FOUND));

        List<Attempt> attempts = attemptRepository.findByStudentIdAndStatus(userId, "completed");
        long passed = attempts.stream().filter(Attempt::isPassed).count();
        double avgScore = attempts.stream()
            .mapToDouble(Attempt::getPercentage).average().orElse(0);

        List<Map<String, Object>> certificates = new ArrayList<>();
        for (Attempt a : attempts) {
            if (!a.isCertificateIssued()) continue;
            Map<String, Object> c = new HashMap<>();
            c.put("quizTitle", a.getQuiz().getTitle());
            c.put("subject", a.getQuiz().getSubject());
            c.put("score", a.getPercentage());
            c.put("certificateId", a.getCertificateId());
            certificates.add(c);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("name", student.getName());
        data.put("department", student.getDepartment() != null ? student.getDepartment() : "");
        data.put("totalPoints", student.getTotalPoints());
        data.put("level", student.getLevel());
        data.put("streak", student.getStreak());
        data.put("badges", student.getBadges());
        data.put("totalAttempts", attempts.size());
        data.put("passed", passed);
        data.put("avgScore", Math.round(avgScore * 10.0) / 10.0);
        data.put("certificates", certificates);

        return data;
    }

    @Override
    public Map<String, Object> getEngagementScore(User user) {
        List<Attempt> attempts = attemptRepository.findByStudentIdOrderByCreatedAtDesc(user.getId());

        long totalAttempts = attempts.size();
        long streak = user.getStreak();
        long xp = user.getTotalPoints();

        double score = (totalAttempts * 2) + (streak * 5) + (xp / 10.0);
        score = Math.round(score * 10.0) / 10.0;

        String grade = score >= 200 ? "S" : score >= 150 ? "A" :
                       score >= 100 ? "B" : score >= 50 ? "C" : "D";

        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("attemptsContribution", totalAttempts * 2);
        breakdown.put("streakContribution", streak * 5);
        breakdown.put("xpContribution", xp / 10.0);

        Map<String, Object> data = new HashMap<>();
        data.put("engagementScore", score);
        data.put("grade", grade);
        data.put("breakdown", breakdown);
        data.put("totalAttempts", totalAttempts);
        data.put("streak", streak);
        data.put("xp", xp);

        return data;
    }

    private String getMasteryLevel(double score) {
        if (score >= 90) return "Expert";
        if (score >= 75) return "Advanced";
        if (score >= 60) return "Intermediate";
        if (score >= 40) return "Beginner";
        return "Novice";
    }
}
