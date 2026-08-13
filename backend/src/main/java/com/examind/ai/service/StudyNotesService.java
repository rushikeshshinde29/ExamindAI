package com.examind.ai.service;

import com.examind.ai.entity.StudyNote;
import com.examind.ai.entity.User;
import java.util.List;
import java.util.Map;

public interface StudyNotesService {
    List<StudyNote> getMyNotes(User user, String subject);
    StudyNote createNote(User user, Map<String, Object> body);
    void updateNote(Long id, User user, Map<String, Object> body);
    void deleteNote(Long id, User user);
    List<StudyNote> getFlashcards(User user);
}
