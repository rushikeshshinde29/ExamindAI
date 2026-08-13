package com.examind.ai.controller;

import com.examind.ai.entity.Bookmark;
import com.examind.ai.entity.User;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.BookmarkService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bookmarks")
public class BookmarkController {

    private final BookmarkService bookmarkService;

    public BookmarkController(BookmarkService bookmarkService) {
        this.bookmarkService = bookmarkService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getMyBookmarks(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        List<Bookmark> bookmarks = bookmarkService.getMyBookmarks(user);
        return ResponseEntity.ok(Map.of("success", true, "data", bookmarks, "total", bookmarks.size()));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> addBookmark(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = ((CustomUserDetails) userDetails).getUser();
        Long questionId = Long.valueOf(body.get("questionId").toString());
        String note = (String) body.getOrDefault("note", "");

        Bookmark bookmark = bookmarkService.addBookmark(user, questionId, note);
        if (bookmark == null) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Already bookmarked"));
        }

        return new ResponseEntity<>(Map.of("success", true, "message", "Question bookmarked", "data", bookmark), HttpStatus.CREATED);
    }

    @DeleteMapping("/{questionId}")
    public ResponseEntity<Map<String, Object>> removeBookmark(
            @PathVariable("questionId") Long questionId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = ((CustomUserDetails) userDetails).getUser();
        bookmarkService.removeBookmark(user, questionId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Bookmark removed"));
    }

    @GetMapping("/{questionId}/status")
    public ResponseEntity<Map<String, Object>> checkBookmark(
            @PathVariable("questionId") Long questionId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = ((CustomUserDetails) userDetails).getUser();
        boolean isBookmarked = bookmarkService.checkBookmark(user, questionId);
        return ResponseEntity.ok(Map.of("success", true, "isBookmarked", isBookmarked));
    }
}
