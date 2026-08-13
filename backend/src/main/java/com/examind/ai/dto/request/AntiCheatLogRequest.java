package com.examind.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AntiCheatLogRequest {

    @NotBlank(message = "Event type is required")
    private String event; // tab_switch, copy_attempt, fullscreen_exit, right_click

    private String details = "";
}
