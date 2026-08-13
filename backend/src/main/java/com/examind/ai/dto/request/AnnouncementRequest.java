package com.examind.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnnouncementRequest {

    @NotBlank(message = "Announcement title is required")
    private String title;

    @NotBlank(message = "Announcement message is required")
    private String message;

    private String targetRole; // null/empty means all users, else specific role

    private String icon = "📢";
}
