package com.examind.ai.repository;

import com.examind.ai.entity.StudyNote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudyNoteRepository extends JpaRepository<StudyNote, Long> {
    List<StudyNote> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<StudyNote> findByUserIdAndFlashcardTrue(Long userId);
    List<StudyNote> findByUserIdAndSubject(Long userId, String subject);
}
