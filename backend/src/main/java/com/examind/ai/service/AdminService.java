package com.examind.ai.service;

import com.examind.ai.dto.request.AnnouncementRequest;
import com.examind.ai.dto.request.RegisterRequest;
import com.examind.ai.dto.response.UserDto;
import com.examind.ai.entity.Group;
import com.examind.ai.entity.Quiz;
import com.examind.ai.entity.User;
import org.springframework.data.domain.Page;
import java.util.List;
import java.util.Map;

public interface AdminService {
    // Stats
    Map<String, Object> getDashboardStats();

    // User Management
    Page<User> getUsers(String role, String status, String search, int page, int limit);
    Map<String, Object> getUserDetails(Long userId);
    User createUser(RegisterRequest request);
    User updateUser(Long userId, RegisterRequest request);
    void deleteUser(Long userId);
    User toggleUserBan(Long userId, String reason);
    void resetUserPassword(Long userId, String newPassword);
    User toggleUserActive(Long userId);

    // Quiz Overview
    Page<Quiz> getQuizzes(String search, Boolean published, int page, int limit);

    // Group Management
    List<Group> getAllGroups();
    Group createGroup(Group group);
    Group updateGroup(Long groupId, Group groupDetails);
    void deleteGroup(Long groupId);
    Map<String, Object> addStudentsToGroup(Long groupId, List<String> emails);
    void removeStudentFromGroup(Long groupId, Long userId);
    Group assignFacultyToGroup(Long groupId, Long facultyId);
    Group removeFacultyFromGroup(Long groupId, Long facultyId);

    // Announcements
    void broadcastAnnouncement(AnnouncementRequest request);
}
