package com.examind.ai.controller;

import com.examind.ai.dto.request.ChangePasswordRequest;
import com.examind.ai.dto.request.LoginRequest;
import com.examind.ai.dto.request.ProfileRequest;
import com.examind.ai.dto.request.RegisterRequest;
import com.examind.ai.dto.response.AuthResponse;
import com.examind.ai.dto.response.UserDto;
import com.examind.ai.entity.User;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.AuthService;
import com.examind.ai.exception.CustomException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        
        AuthResponse response = authService.register(request, ipAddress, userAgent);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        
        AuthResponse response = authService.login(request, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }


    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        AuthResponse response = authService.verifyOtp(email, otp);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<Map<String, Object>> resendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        authService.resendOtp(email);
        return ResponseEntity.ok(Map.of("success", true, "message", "OTP resent successfully"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        authService.forgotPassword(email);
        return ResponseEntity.ok(Map.of("success", true, "message", "Password reset link sent to your email"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String password = body.get("password");
        authService.resetPassword(token, password);
        return ResponseEntity.ok(Map.of("success", true, "message", "Password reset successful"));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Not authenticated"));
        }
        User user = ((CustomUserDetails) userDetails).getUser();
        UserDto userDto = authService.getCurrentUser(user);
        return ResponseEntity.ok(Map.of("success", true, "user", userDto));
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@AuthenticationPrincipal UserDetails userDetails,
                                                             @RequestBody ProfileRequest request) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Not authenticated"));
        }
        User user = ((CustomUserDetails) userDetails).getUser();
        UserDto updated = authService.updateProfile(user, request);
        return ResponseEntity.ok(Map.of("success", true, "message", "Profile updated", "user", updated));
    }

    @PutMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(@AuthenticationPrincipal UserDetails userDetails,
                                                              @Valid @RequestBody ChangePasswordRequest request) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Not authenticated"));
        }
        User user = ((CustomUserDetails) userDetails).getUser();
        authService.changePassword(user, request);
        return ResponseEntity.ok(Map.of("success", true, "message", "Password changed successfully"));
    }
}
