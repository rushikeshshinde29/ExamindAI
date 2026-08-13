package com.examind.ai.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProfileRequest {
    private String name;
    private String department;
    private String studentId;
    private String employeeId;
    private String bio;
    private String phone;
    private String semester;
    private String division;
}
