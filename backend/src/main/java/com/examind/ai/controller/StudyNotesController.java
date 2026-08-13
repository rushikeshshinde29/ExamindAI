package com.examind.ai.controller;

import com.examind.ai.entity.StudyNote;
import com.examind.ai.entity.User;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.StudyNotesService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
public class StudyNotesController {

    private final StudyNotesService studyNotesService;

    public StudyNotesController(StudyNotesService studyNotesService) {
        this.studyNotesService = studyNotesService;
    }

    @GetMapping("/study-notes")
    public ResponseEntity<Map<String, Object>> getMyNotes(
            @RequestParam(required = false) String subject,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        List<StudyNote> notes = studyNotesService.getMyNotes(user, subject);
        return ResponseEntity.ok(Map.of("success", true, "data", notes, "total", notes.size()));
    }

    @PostMapping("/study-notes")
    public ResponseEntity<Map<String, Object>> createNote(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        StudyNote saved = studyNotesService.createNote(user, body);
        return new ResponseEntity<>(Map.of("success", true, "message", "Note created", "data", saved), HttpStatus.CREATED);
    }

    @PutMapping("/study-notes/{id}")
    public ResponseEntity<Map<String, Object>> updateNote(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        studyNotesService.updateNote(id, user, body);
        return ResponseEntity.ok(Map.of("success", true, "message", "Note updated"));
    }

    @DeleteMapping("/study-notes/{id}")
    public ResponseEntity<Map<String, Object>> deleteNote(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        studyNotesService.deleteNote(id, user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Note deleted"));
    }

    @GetMapping("/study-notes/flashcards")
    public ResponseEntity<Map<String, Object>> getFlashcards(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        List<StudyNote> flashcards = studyNotesService.getFlashcards(user);
        return ResponseEntity.ok(Map.of("success", true, "data", flashcards));
    }
}
