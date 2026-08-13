package com.examind.ai.controller;

import com.examind.ai.entity.*;
import com.examind.ai.exception.CustomException;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.AdminService;
import com.examind.ai.service.GroupService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping
public class GroupController {

    private final GroupService groupService;
    private final AdminService adminService;

    public GroupController(GroupService groupService, AdminService adminService) {
        this.groupService = groupService;
        this.adminService = adminService;
    }

    // Get all groups assigned to the logged-in Faculty member
    @GetMapping("/faculty/groups")
    public ResponseEntity<Map<String, Object>> getFacultyGroups(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        List<Group> groups = groupService.getFacultyGroups(user);
        return ResponseEntity.ok(Map.of("success", true, "data", groups));
    }

    // List all active Faculty users in system (for "+ Add Faculty" dropdown)
    @GetMapping("/faculty/groups/users/faculty")
    public ResponseEntity<Map<String, Object>> getAllActiveFaculty() {
        List<User> faculties = groupService.getAllActiveFaculty();
        return ResponseEntity.ok(Map.of("success", true, "data", faculties));
    }

    // Search registered student users (for "+ Add Students" autocomplete search)
    @GetMapping("/faculty/groups/users/students")
    public ResponseEntity<Map<String, Object>> searchStudents(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        org.springframework.data.domain.Page<User> usersPage = adminService.getUsers("student", "all", search, 1, limit);
        return ResponseEntity.ok(Map.of("success", true, "data", usersPage.getContent()));
    }

    // Add students to a group by emails
    @PostMapping("/faculty/groups/{id}/students")
    public ResponseEntity<Map<String, Object>> facultyAddStudents(
            @PathVariable("id") Long groupId,
            @RequestBody Map<String, List<String>> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        groupService.validateAndGetGroup(groupId, user);
        
        List<String> emails = body.get("emails");
        if (emails == null || emails.isEmpty()) {
            throw new CustomException("Email list cannot be empty", HttpStatus.BAD_REQUEST);
        }
        
        Map<String, Object> results = adminService.addStudentsToGroup(groupId, emails);
        return ResponseEntity.ok(Map.of("success", true, "message", "Student emails processed", "results", results));
    }

    // Remove student from a group
    @DeleteMapping("/faculty/groups/{id}/students/{userId}")
    public ResponseEntity<Map<String, Object>> facultyRemoveStudent(
            @PathVariable("id") Long groupId,
            @PathVariable("userId") Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        groupService.validateAndGetGroup(groupId, user);
        
        adminService.removeStudentFromGroup(groupId, userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Student removed from group successfully"));
    }

    // Assign co-faculty member to a group
    @PostMapping("/faculty/groups/{id}/faculty")
    public ResponseEntity<Map<String, Object>> facultyAssignCoFaculty(
            @PathVariable("id") Long groupId,
            @RequestBody Map<String, Long> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        groupService.validateAndGetGroup(groupId, user);
        
        Long facultyId = body.get("facultyId");
        if (facultyId == null) {
            throw new CustomException("Faculty ID is required", HttpStatus.BAD_REQUEST);
        }
        
        Group group = adminService.assignFacultyToGroup(groupId, facultyId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Co-faculty assigned to group successfully", "data", group));
    }

    // Remove co-faculty member from a group
    @DeleteMapping("/faculty/groups/{id}/faculty/{facultyId}")
    public ResponseEntity<Map<String, Object>> facultyRemoveCoFaculty(
            @PathVariable("id") Long groupId,
            @PathVariable("facultyId") Long facultyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        groupService.validateAndGetGroup(groupId, user);
        
        if (user.getId().equals(facultyId) && !"admin".equalsIgnoreCase(user.getRole())) {
            throw new CustomException("You cannot remove yourself from the group. Contact Admin if required.", HttpStatus.BAD_REQUEST);
        }
        
        Group group = adminService.removeFacultyFromGroup(groupId, facultyId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Co-faculty removed from group successfully", "data", group));
    }

    // Get group(s) assigned to the student (including classmates, professors, and recent announcements)
    @GetMapping("/student/groups")
    public ResponseEntity<Map<String, Object>> getStudentGroups(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        List<Map<String, Object>> enrichedGroups = groupService.getStudentGroups(user);
        return ResponseEntity.ok(Map.of("success", true, "data", enrichedGroups));
    }
}
