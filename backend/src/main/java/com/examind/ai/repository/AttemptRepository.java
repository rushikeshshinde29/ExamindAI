package com.examind.ai.repository;

import com.examind.ai.entity.Attempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttemptRepository extends JpaRepository<Attempt, Long> {
    long countByStatusIn(List<String> statuses);
    long countByIsPassedTrue();
    long countByQuizIdAndStudentIdAndStatusIn(Long quizId, Long studentId, List<String> statuses);
    long countByStudentIdAndStatus(Long studentId, String status);
    long countByStudentIdAndStatusAndIsPassedTrue(Long studentId, String status);

    List<Attempt> findTop10ByStatusOrderByCreatedAtDesc(String status);
    List<Attempt> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<Attempt> findByStudentIdAndStatus(Long studentId, String status);

    Optional<Attempt> findFirstByQuizIdAndStudentIdAndStatus(Long quizId, Long studentId, String status);

    @Query("SELECT a FROM Attempt a WHERE a.student.id = :studentId AND a.quiz.id = :quizId AND a.status = :status")
    List<Attempt> findByStudentIdAndQuizIdAndStatus(@Param("studentId") Long studentId, @Param("quizId") Long quizId, @Param("status") String status);

    @Query("SELECT a FROM Attempt a WHERE a.quiz.id = :quizId AND a.status IN :statuses ORDER BY a.percentage DESC, a.timeTaken ASC")
    List<Attempt> findQuizLeaderboard(@Param("quizId") Long quizId, @Param("statuses") List<String> statuses);

    @Query("SELECT COUNT(a) FROM Attempt a WHERE a.quiz.id = :quizId AND a.status = 'completed' AND a.percentage > :percentage")
    long countBetterAttemptsInQuiz(@Param("quizId") Long quizId, @Param("percentage") double percentage);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'student' AND u.totalPoints > :points")
    long countBetterStudentsGlobally(@Param("points") int points);

    @Query("SELECT a FROM Attempt a WHERE a.quiz.id IN :quizIds AND a.status = 'completed' ORDER BY a.createdAt DESC")
    List<Attempt> findCompletedAttemptsForQuizzes(@Param("quizIds") List<Long> quizIds);

    @Query("SELECT a FROM Attempt a WHERE a.quiz.id IN :quizIds AND a.status = 'completed' AND a.isPassed = true")
    List<Attempt> findPassedAttemptsForQuizzes(@Param("quizIds") List<Long> quizIds);

    // Weekly statistics
    @Query("SELECT a.createdAt FROM Attempt a WHERE a.quiz.id IN :quizIds AND a.status = 'completed' AND a.createdAt >= :since")
    List<LocalDateTime> findCompletedDatesForQuizzes(@Param("quizIds") List<Long> quizIds, @Param("since") LocalDateTime since);

    @Query("SELECT a.createdAt FROM Attempt a WHERE a.status = 'completed' AND a.createdAt >= :since")
    List<LocalDateTime> findWeeklyAttemptsGlobally(@Param("since") LocalDateTime since);

    @Query("SELECT a FROM Attempt a WHERE a.quiz.id = :quizId AND a.status = 'completed'")
    List<Attempt> findCompletedByQuizId(@Param("quizId") Long quizId);

    Optional<Attempt> findByCertificateId(String certificateId);
 
    long countByQuizId(Long quizId);

    @Query("SELECT a.student, AVG(a.percentage) as avgScore, COUNT(a) as totalAttempts, SUM(a.obtainedMarks) as totalMarks " +
           "FROM Attempt a WHERE a.quiz.id IN :quizIds AND a.status = 'completed' " +
           "GROUP BY a.student ORDER BY avgScore DESC")
    List<Object[]> findSubjectLeaderboard(@Param("quizIds") List<Long> quizIds, org.springframework.data.domain.Pageable pageable);
}

