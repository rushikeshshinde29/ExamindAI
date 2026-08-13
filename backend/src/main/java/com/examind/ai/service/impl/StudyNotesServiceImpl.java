package com.examind.ai.service.impl;

import com.examind.ai.entity.StudyNote;
import com.examind.ai.entity.User;
import com.examind.ai.exception.CustomException;
import com.examind.ai.repository.StudyNoteRepository;
import com.examind.ai.service.StudyNotesService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class StudyNotesServiceImpl implements StudyNotesService {

    private final StudyNoteRepository noteRepository;

    public StudyNotesServiceImpl(StudyNoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }

    @Override
    public List<StudyNote> getMyNotes(User user, String subject) {
        if (subject != null) {
            return noteRepository.findByUserIdAndSubject(user.getId(), subject);
        } else {
            return noteRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        }
    }

    @Override
    public StudyNote createNote(User user, Map<String, Object> body) {
        String content = (String) body.get("content");
        if (content == null || content.isBlank()) {
            throw new CustomException("Content is required", HttpStatus.BAD_REQUEST);
        }

        StudyNote note = new StudyNote();
        note.setUser(user);
        note.setContent(content);
        note.setTitle((String) body.getOrDefault("title", ""));
        note.setSubject((String) body.getOrDefault("subject", ""));
        note.setColor((String) body.getOrDefault("color", "#fff9c4"));
        note.setFlashcard(Boolean.parseBoolean(body.getOrDefault("flashcard", false).toString()));
        note.setFlashcardFront((String) body.getOrDefault("flashcardFront", ""));
        note.setFlashcardBack((String) body.getOrDefault("flashcardBack", ""));

        return noteRepository.save(note);
    }

    @Override
    public void updateNote(Long id, User user, Map<String, Object> body) {
        StudyNote note = noteRepository.findById(id)
                .orElseThrow(() -> new CustomException("Note not found", HttpStatus.NOT_FOUND));
        if (!note.getUser().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized", HttpStatus.FORBIDDEN);
        }

        if (body.containsKey("content")) note.setContent((String) body.get("content"));
        if (body.containsKey("title")) note.setTitle((String) body.get("title"));
        if (body.containsKey("subject")) note.setSubject((String) body.get("subject"));
        if (body.containsKey("color")) note.setColor((String) body.get("color"));
        if (body.containsKey("flashcard")) note.setFlashcard(Boolean.parseBoolean(body.get("flashcard").toString()));
        if (body.containsKey("flashcardFront")) note.setFlashcardFront((String) body.get("flashcardFront"));
        if (body.containsKey("flashcardBack")) note.setFlashcardBack((String) body.get("flashcardBack"));

        noteRepository.save(note);
    }

    @Override
    public void deleteNote(Long id, User user) {
        StudyNote note = noteRepository.findById(id)
                .orElseThrow(() -> new CustomException("Note not found", HttpStatus.NOT_FOUND));
        if (!note.getUser().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized", HttpStatus.FORBIDDEN);
        }
        noteRepository.delete(note);
    }

    @Override
    public List<StudyNote> getFlashcards(User user) {
        return noteRepository.findByUserIdAndFlashcardTrue(user.getId());
    }
}
