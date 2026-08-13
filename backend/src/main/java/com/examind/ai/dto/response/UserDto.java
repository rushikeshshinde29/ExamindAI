package com.examind.ai.dto.response;

import com.examind.ai.entity.User;
import lombok.*;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String avatar;
    private String department;
    private String studentId;
    private String employeeId;
    private String bio;
    private String phone;
    private String semester;
    private String division;
    private boolean isActive;
    private boolean isBanned;
    private boolean emailVerified;
    private String banReason;
    private int totalPoints;
    private int level;
    private int streak;
    private List<String> badges;
    private boolean emailNotifications;
    private String theme;
    
    @JsonProperty("isPro")
    private boolean isPro;

    public static UserDto fromEntity(User user) {
        if (user == null) return null;
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setAvatar(user.getAvatar());
        dto.setDepartment(user.getDepartment());
        dto.setStudentId(user.getStudentId());
        dto.setEmployeeId(user.getEmployeeId());
        dto.setBio(user.getBio());
        dto.setPhone(user.getPhone());
        dto.setSemester(user.getSemester());
        dto.setDivision(user.getDivision());
        dto.setActive(user.isActive());
        dto.setBanned(user.isBanned());
        dto.setEmailVerified(user.isEmailVerified());
        dto.setBanReason(user.getBanReason());
        dto.setTotalPoints(user.getTotalPoints());
        dto.setLevel(user.getLevel());
        dto.setStreak(user.getStreak());
        dto.setBadges(user.getBadges());
        dto.setEmailNotifications(user.isEmailNotifications());
        dto.setTheme(user.getTheme());
        dto.setPro(user.isPro());
        return dto;
    }
}
