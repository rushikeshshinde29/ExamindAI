package com.examind.ai.service.impl;

import com.examind.ai.entity.*;
import com.examind.ai.exception.CustomException;
import com.examind.ai.repository.*;
import com.examind.ai.service.GradeBookService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GradeBookServiceImpl implements GradeBookService {

    private final GradeBookRepository gradeBookRepository;
    private final AttemptRepository attemptRepository;
    private final QuizRepository quizRepository;

    public GradeBookServiceImpl(GradeBookRepository gradeBookRepository,
                                 AttemptRepository attemptRepository,
                                 QuizRepository quizRepository) {
        this.gradeBookRepository = gradeBookRepository;
        this.attemptRepository = attemptRepository;
        this.quizRepository = quizRepository;
    }

    @Override
    public Map<String, Object> getFacultyGradeBook(User user) {
        List<GradeBookEntry> entries = "admin".equals(user.getRole())
                ? gradeBookRepository.findAll()
                : gradeBookRepository.findByFacultyId(user.getId());

        Map<String, List<Map<String, Object>>> grouped = new LinkedHashMap<>();
        for (GradeBookEntry e : entries) {
            String quizTitle = e.getQuiz().getTitle() + " (#" + e.getQuiz().getId() + ")";
            Map<String, Object> row = new HashMap<>();
            row.put("studentId", e.getStudent().getId());
            row.put("studentName", e.getStudent().getName());
            row.put("studentEmail", e.getStudent().getEmail());
            row.put("department", e.getStudent().getDepartment() != null ? e.getStudent().getDepartment() : "");
            row.put("bestScore", e.getBestScore());
            row.put("grade", e.getGrade());
            row.put("attempts", e.getAttemptsCount());
            row.put("lastAttempt", e.getLastAttemptAt() != null ? e.getLastAttemptAt().toString() : "");
            grouped.computeIfAbsent(quizTitle, k -> new ArrayList<>()).add(row);
        }
        Map<String, Object> res = new HashMap<>();
        res.put("data", grouped);
        res.put("totalEntries", entries.size());
        return res;
    }

    @Override
    public Map<String, Object> syncGrades(User user) {
        if (!List.of("admin", "faculty").contains(user.getRole())) {
            throw new CustomException("Faculty/Admin access required", HttpStatus.FORBIDDEN);
        }
        List<Quiz> quizzes = "admin".equals(user.getRole())
                ? quizRepository.findAll()
                : quizRepository.findByCreatedById(user.getId());

        int synced = 0;
        for (Quiz quiz : quizzes) {
            List<Attempt> attempts = attemptRepository.findCompletedByQuizId(quiz.getId());
            Map<Long, List<Attempt>> byStudent = new HashMap<>();
            for (Attempt a : attempts) {
                byStudent.computeIfAbsent(a.getStudent().getId(), k -> new ArrayList<>()).add(a);
            }
            for (Map.Entry<Long, List<Attempt>> entry : byStudent.entrySet()) {
                List<Attempt> studentAttempts = entry.getValue();
                double best = studentAttempts.stream().mapToDouble(Attempt::getPercentage).max().orElse(0);
                GradeBookEntry gb = gradeBookRepository
                        .findByStudentIdAndQuizId(entry.getKey(), quiz.getId())
                        .orElse(new GradeBookEntry());
                gb.setStudent(studentAttempts.get(0).getStudent());
                gb.setQuiz(quiz);
                gb.setBestScore(Math.round(best * 10.0) / 10.0);
                gb.setGrade(calculateGrade(best));
                gb.setAttemptsCount(studentAttempts.size());
                gb.setLastAttemptAt(studentAttempts.stream()
                        .map(Attempt::getCreatedAt)
                        .max(java.time.LocalDateTime::compareTo).orElse(null));
                gradeBookRepository.save(gb);
                synced++;
            }
        }
        return Map.of("message", "Synced " + synced + " grade entries");
    }

    public static String calculateGrade(double score) {
        if (score >= 90) return "A+";
        if (score >= 80) return "A";
        if (score >= 70) return "B";
        if (score >= 60) return "C";
        if (score >= 50) return "D";
        return "F";
    }
}
