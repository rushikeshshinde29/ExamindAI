package com.examind.ai.service;

import com.examind.ai.dto.request.ChangePasswordRequest;
import com.examind.ai.dto.request.LoginRequest;
import com.examind.ai.dto.request.ProfileRequest;
import com.examind.ai.dto.request.RegisterRequest;
import com.examind.ai.dto.response.AuthResponse;
import com.examind.ai.dto.response.UserDto;
import com.examind.ai.entity.User;

public interface AuthService {
    AuthResponse register(RegisterRequest request, String ipAddress, String userAgent);
    AuthResponse login(LoginRequest request, String ipAddress, String userAgent);
    UserDto getCurrentUser(User currentUser);
    UserDto updateProfile(User currentUser, ProfileRequest request);
    void changePassword(User currentUser, ChangePasswordRequest request);
    AuthResponse verifyOtp(String email, String otp);
    void resendOtp(String email);
    void forgotPassword(String email);
    void resetPassword(String token, String newPassword);
}
