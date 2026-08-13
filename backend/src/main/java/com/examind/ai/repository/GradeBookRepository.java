package com.examind.ai.repository;

import com.examind.ai.entity.GradeBookEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface GradeBookRepository extends JpaRepository<GradeBookEntry, Long> {
    List<GradeBookEntry> findByStudentIdOrderByUpdatedAtDesc(Long studentId);
    List<GradeBookEntry> findByQuizIdOrderByBestScoreDesc(Long quizId);
    Optional<GradeBookEntry> findByStudentIdAndQuizId(Long studentId, Long quizId);

    @Query("SELECT g FROM GradeBookEntry g WHERE g.quiz.createdBy.id = :facultyId ORDER BY g.updatedAt DESC")
    List<GradeBookEntry> findByFacultyId(@Param("facultyId") Long facultyId);
}
