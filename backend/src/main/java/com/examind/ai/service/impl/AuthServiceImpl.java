package com.examind.ai.service.impl;

import com.examind.ai.dto.request.ChangePasswordRequest;
import com.examind.ai.dto.request.LoginRequest;
import com.examind.ai.dto.request.ProfileRequest;
import com.examind.ai.dto.request.RegisterRequest;
import com.examind.ai.dto.response.AuthResponse;
import com.examind.ai.dto.response.UserDto;
import com.examind.ai.entity.ActivityLog;
import com.examind.ai.entity.Notification;
import com.examind.ai.entity.User;
import com.examind.ai.exception.CustomException;
import com.examind.ai.repository.ActivityLogRepository;
import com.examind.ai.repository.NotificationRepository;
import com.examind.ai.repository.UserRepository;
import com.examind.ai.security.JwtTokenProvider;
import com.examind.ai.service.AuthService;
import com.examind.ai.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final ActivityLogRepository activityLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;

    public AuthServiceImpl(UserRepository userRepository,
                           NotificationRepository notificationRepository,
                           ActivityLogRepository activityLogRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider tokenProvider,
                           EmailService emailService) {
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.activityLogRepository = activityLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.emailService = emailService;
    }

    @Override
    public AuthResponse register(RegisterRequest request, String ipAddress, String userAgent) {
        logger.info("Registering new user with email: {}", request.getEmail());
        if (userRepository.existsByEmail(request.getEmail())) {
            logger.warn("Email already registered: {}", request.getEmail());
            throw new CustomException("Email already registered", HttpStatus.BAD_REQUEST);
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail().toLowerCase().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        // Self-registration defaults to student
        String role = (request.getRole() != null) ? request.getRole().toLowerCase() : "student";
        if (!role.equals("admin") && !role.equals("faculty") && !role.equals("student")) {
            role = "student";
        }
        user.setRole(role);
        
        user.setDepartment(request.getDepartment());
        user.setStudentId(request.getStudentId());
        user.setEmployeeId(request.getEmployeeId());
        user.setPhone(request.getPhone());
        user.setSemester(request.getSemester());
        user.setDivision(request.getDivision());

        // Setup OTP for email verification
        String otp = String.format("%06d", new Random().nextInt(999999));
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        user.setEmailVerified(false);

        User savedUser = userRepository.save(user);

        // Send OTP email
        logger.info("════════════════════════════════════════════════");
        logger.info("VERIFICATION OTP FOR {}: {}", savedUser.getEmail(), otp);
        logger.info("════════════════════════════════════════════════");
        try {
            emailService.sendOtpEmail(savedUser.getEmail(), otp);
        } catch (Exception e) {
            logger.error("Failed to send OTP email: {}", e.getMessage());
        }

        // Welcome Notification
        Notification notification = new Notification();
        notification.setUser(savedUser);
        notification.setTitle("Welcome to Examind AI! 🎉");
        notification.setMessage("Hi " + savedUser.getName() + ", please verify your email using the OTP sent to your mailbox.");
        notification.setType("system");
        notification.setIcon("👋");
        notificationRepository.save(notification);

        // Log Activity
        ActivityLog log = new ActivityLog();
        log.setUser(savedUser);
        log.setAction("register");
        log.setIpAddress(ipAddress);
        log.setUserAgent(userAgent);
        activityLogRepository.save(log);

        String token = tokenProvider.generateToken(savedUser.getEmail());
        logger.info("Successfully registered user: {}. OTP code issued.", savedUser.getEmail());
        
        return new AuthResponse(true, "Registration successful. Please verify your email.", token, UserDto.fromEntity(savedUser));
    }

    @Override
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        logger.info("User login attempt from IP: {}, email: {}", ipAddress, request.getEmail());

        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new CustomException("Invalid email or password", HttpStatus.UNAUTHORIZED);
        }

        if (!user.isActive()) {
            logger.warn("Inactive user login attempt: {}", request.getEmail());
            throw new CustomException("Account deactivated. Contact admin.", HttpStatus.UNAUTHORIZED);
        }

        if (user.isBanned()) {
            logger.warn("Banned user login attempt: {}", request.getEmail());
            throw new CustomException("Account banned: " + user.getBanReason(), HttpStatus.UNAUTHORIZED);
        }

        // OTP verification check
        if (!user.isEmailVerified()) {
            String otp = String.format("%06d", new Random().nextInt(999999));
            user.setOtpCode(otp);
            user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
            userRepository.save(user);
            logger.info("════════════════════════════════════════════════");
            logger.info("VERIFICATION OTP FOR {}: {}", user.getEmail(), otp);
            logger.info("════════════════════════════════════════════════");
            try {
                emailService.sendOtpEmail(user.getEmail(), otp);
            } catch (Exception e) {
                logger.error("Failed to send OTP email: {}", e.getMessage());
            }
            throw new CustomException("Email not verified. A verification code has been sent.", HttpStatus.FORBIDDEN);
        }

        user.setLastLogin(LocalDateTime.now());
        user.setLoginCount(user.getLoginCount() + 1);
        User savedUser = userRepository.save(user);

        // Log Activity
        ActivityLog log = new ActivityLog();
        log.setUser(savedUser);
        log.setAction("login");
        log.setIpAddress(ipAddress);
        log.setUserAgent(userAgent);
        activityLogRepository.save(log);

        String token = tokenProvider.generateToken(savedUser.getEmail());
        logger.info("User logged in successfully: {}", savedUser.getEmail());
        
        return new AuthResponse(true, "Login successful", token, UserDto.fromEntity(savedUser));
    }

    @Override
    public UserDto getCurrentUser(User currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElse(currentUser);
        return UserDto.fromEntity(user);
    }

    @Override
    public UserDto updateProfile(User currentUser, ProfileRequest request) {
        logger.info("Updating profile for user: {}", currentUser.getEmail());
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }
        if (request.getDepartment() != null) user.setDepartment(request.getDepartment());
        if (request.getStudentId() != null) user.setStudentId(request.getStudentId());
        if (request.getEmployeeId() != null) user.setEmployeeId(request.getEmployeeId());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getSemester() != null) user.setSemester(request.getSemester());
        if (request.getDivision() != null) user.setDivision(request.getDivision());

        User updatedUser = userRepository.save(user);
        logger.info("Successfully updated profile for user: {}", currentUser.getEmail());
        return UserDto.fromEntity(updatedUser);
    }

    @Override
    public void changePassword(User currentUser, ChangePasswordRequest request) {
        logger.info("Changing password for user: {}", currentUser.getEmail());
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            logger.warn("Password change failed: current password incorrect for user: {}", currentUser.getEmail());
            throw new CustomException("Current password is incorrect", HttpStatus.BAD_REQUEST);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Log Activity
        ActivityLog log = new ActivityLog();
        log.setUser(user);
        log.setAction("password_change");
        activityLogRepository.save(log);

        logger.info("Successfully changed password for user: {}", currentUser.getEmail());
    }

    @Override
    public AuthResponse verifyOtp(String email, String otp) {
        logger.info("Verifying OTP for email: {}", email);
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        if (user.getOtpCode() == null || !user.getOtpCode().equals(otp)) {
            throw new CustomException("Invalid verification code", HttpStatus.BAD_REQUEST);
        }

        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new CustomException("Verification code has expired", HttpStatus.BAD_REQUEST);
        }

        user.setEmailVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        User savedUser = userRepository.save(user);

        // Notification
        Notification notification = new Notification();
        notification.setUser(savedUser);
        notification.setTitle("Email Verified! ✅");
        notification.setMessage("Your account has been fully verified. Welcome aboard!");
        notification.setType("system");
        notification.setIcon("✅");
        notificationRepository.save(notification);

        logger.info("Email verified successfully: {}", email);

        String token = tokenProvider.generateToken(savedUser.getEmail());
        return new AuthResponse(true, "Email verified successfully", token, UserDto.fromEntity(savedUser));
    }

    @Override
    public void resendOtp(String email) {
        logger.info("Resending OTP for email: {}", email);
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        if (user.isEmailVerified()) {
            throw new CustomException("Email is already verified", HttpStatus.BAD_REQUEST);
        }

        String otp = String.format("%06d", new Random().nextInt(999999));
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        logger.info("════════════════════════════════════════════════");
        logger.info("VERIFICATION OTP RESENT FOR {}: {}", user.getEmail(), otp);
        logger.info("════════════════════════════════════════════════");
        try {
            emailService.sendOtpEmail(user.getEmail(), otp);
        } catch (Exception e) {
            logger.error("Failed to resend OTP email: {}", e.getMessage());
        }
        logger.info("OTP resent successfully to: {}", email);
    }

    @Override
    public void forgotPassword(String email) {
        logger.info("Password reset request for email: {}", email);
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        String token = UUID.randomUUID().toString();
        user.setPasswordResetToken(token);
        user.setPasswordResetExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        logger.info("════════════════════════════════════════════════");
        logger.info("PASSWORD RESET TOKEN FOR {}: {}", user.getEmail(), token);
        logger.info("════════════════════════════════════════════════");
        try {
            emailService.sendResetTokenEmail(user.getEmail(), token);
        } catch (Exception e) {
            logger.error("Failed to send reset token email: {}", e.getMessage());
        }

        // Log Activity
        ActivityLog log = new ActivityLog();
        log.setUser(user);
        log.setAction("forgot_password_request");
        activityLogRepository.save(log);

        logger.info("Password reset link sent to: {}", email);
    }

    @Override
    public void resetPassword(String token, String newPassword) {
        logger.info("Resetting password with reset token");
        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new CustomException("Invalid or expired reset token", HttpStatus.NOT_FOUND));

        if (user.getPasswordResetExpiry() == null || user.getPasswordResetExpiry().isBefore(LocalDateTime.now())) {
            throw new CustomException("Reset token has expired", HttpStatus.BAD_REQUEST);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiry(null);
        userRepository.save(user);

        // Log Activity
        ActivityLog log = new ActivityLog();
        log.setUser(user);
        log.setAction("password_reset_success");
        activityLogRepository.save(log);

        logger.info("Password reset successful for user: {}", user.getEmail());
    }
}
