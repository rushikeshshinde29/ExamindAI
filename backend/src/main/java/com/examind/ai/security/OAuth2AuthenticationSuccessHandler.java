package com.examind.ai.security;

import com.examind.ai.entity.User;
import com.examind.ai.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);
    
    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;

    public OAuth2AuthenticationSuccessHandler(UserRepository userRepository, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.tokenProvider = tokenProvider;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        if (email == null) {
            logger.error("OAuth2 user does not contain email attribute");
            getRedirectStrategy().sendRedirect(request, response, "http://localhost:5173/login?error=no_email");
            return;
        }

        logger.info("OAuth2 login success for email: {}", email);
        
        Optional<User> userOpt = userRepository.findByEmail(email.toLowerCase().trim());
        User user;
        if (userOpt.isEmpty()) {
            // Self register the OAuth2 user as a student
            user = new User();
            user.setEmail(email.toLowerCase().trim());
            user.setName(name != null ? name : "Google User");
            // Set dummy password since authentication is via Google
            user.setPassword("");
            user.setRole("student");
            user.setEmailVerified(true);
            user.setActive(true);
            user = userRepository.save(user);
            logger.info("Automatically registered new Google OAuth2 user: {}", email);
        } else {
            user = userOpt.get();
            if (!user.isActive()) {
                getRedirectStrategy().sendRedirect(request, response, "http://localhost:5173/login?error=deactivated");
                return;
            }
            if (user.isBanned()) {
                getRedirectStrategy().sendRedirect(request, response, "http://localhost:5173/login?error=banned");
                return;
            }
            // Ensure email is marked verified if logging in via Google
            if (!user.isEmailVerified()) {
                user.setEmailVerified(true);
                userRepository.save(user);
            }
        }

        String token = tokenProvider.generateToken(user.getEmail());
        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:5173/login")
                .queryParam("token", token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
