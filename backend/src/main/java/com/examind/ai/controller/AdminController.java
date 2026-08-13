package com.examind.ai.controller;

import com.examind.ai.dto.request.RegisterRequest;
import com.examind.ai.entity.Group;
import com.examind.ai.entity.Quiz;
import com.examind.ai.entity.User;
import com.examind.ai.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of("success", true, "data", adminService.getDashboardStats()));
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getUsers(
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "20") int limit) {
        Page<User> usersPage = adminService.getUsers(role, status, search, page, limit);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", usersPage.getContent(),
                "total", usersPage.getTotalElements(),
                "page", page,
                "pages", usersPage.getTotalPages()
        ));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> getUserDetails(@PathVariable("id") Long userId) {
        return ResponseEntity.ok(Map.of("success", true, "data", adminService.getUserDetails(userId)));
    }

    @PostMapping("/users")
    public ResponseEntity<Map<String, Object>> createUser(@Valid @RequestBody RegisterRequest request) {
        User user = adminService.createUser(request);
        return new ResponseEntity<>(Map.of("success", true, "message", "User created", "data", user), HttpStatus.CREATED);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable("id") Long userId,
                                                          @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(Map.of("success", true, "message", "User updated", "data", adminService.updateUser(userId, request)));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable("id") Long userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "User deleted"));
    }

    @PatchMapping("/users/{id}/toggle-active")
    public ResponseEntity<Map<String, Object>> toggleActive(@PathVariable("id") Long userId) {
        return ResponseEntity.ok(Map.of("success", true, "message", "User active status toggled", "data", adminService.toggleUserActive(userId)));
    }

    @GetMapping("/quizzes")
    public ResponseEntity<Map<String, Object>> getQuizzes(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "published", required = false) Boolean published,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "20") int limit) {
        Page<Quiz> quizzesPage = adminService.getQuizzes(search, published, page, limit);
        return ResponseEntity.ok(Map.of("success", true, "data", quizzesPage.getContent(), "total", quizzesPage.getTotalElements()));
    }

    @GetMapping("/groups")
    public ResponseEntity<Map<String, Object>> getGroups() {
        return ResponseEntity.ok(Map.of("success", true, "data", adminService.getAllGroups()));
    }

    @PostMapping("/groups")
    public ResponseEntity<Map<String, Object>> createGroup(@RequestBody Group group) {
        return new ResponseEntity<>(Map.of("success", true, "message", "Group created", "data", adminService.createGroup(group)), HttpStatus.CREATED);
    }

    @PutMapping("/groups/{id}")
    public ResponseEntity<Map<String, Object>> updateGroup(@PathVariable("id") Long groupId, @RequestBody Group group) {
        return ResponseEntity.ok(Map.of("success", true, "message", "Group updated", "data", adminService.updateGroup(groupId, group)));
    }

    @DeleteMapping("/groups/{id}")
    public ResponseEntity<Map<String, Object>> deleteGroup(@PathVariable("id") Long groupId) {
        adminService.deleteGroup(groupId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Group deleted"));
    }

    @PostMapping("/groups/{id}/students")
    public ResponseEntity<Map<String, Object>> addStudents(@PathVariable("id") Long groupId,
                                                           @RequestBody Map<String, List<String>> body) {
        return ResponseEntity.ok(Map.of("success", true, "message", "Emails processed", "results", adminService.addStudentsToGroup(groupId, body.get("emails"))));
    }

    @DeleteMapping("/groups/{id}/students/{userId}")
    public ResponseEntity<Map<String, Object>> removeStudent(@PathVariable("id") Long groupId, @PathVariable("userId") Long userId) {
        adminService.removeStudentFromGroup(groupId, userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Student removed from group"));
    }

    @PostMapping("/groups/{id}/faculty")
    public ResponseEntity<Map<String, Object>> assignFaculty(@PathVariable("id") Long groupId, @RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(Map.of("success", true, "message", "Faculty assigned to group", "data", adminService.assignFacultyToGroup(groupId, body.get("facultyId"))));
    }

    @DeleteMapping("/groups/{id}/faculty/{facultyId}")
    public ResponseEntity<Map<String, Object>> removeFaculty(@PathVariable("id") Long groupId, @PathVariable("facultyId") Long facultyId) {
        return ResponseEntity.ok(Map.of("success", true, "message", "Faculty removed from group", "data", adminService.removeFacultyFromGroup(groupId, facultyId)));
    }
}
