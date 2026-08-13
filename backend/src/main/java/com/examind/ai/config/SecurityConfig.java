package com.examind.ai.config;

import com.examind.ai.security.JwtAuthenticationFilter;
import com.examind.ai.security.OAuth2AuthenticationSuccessHandler;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.oAuth2AuthenticationSuccessHandler = oAuth2AuthenticationSuccessHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/login", "/auth/register", "/auth/verify-otp", "/auth/resend-otp", "/auth/forgot-password", "/auth/reset-password", "/health", "/payments/webhook", "/internal/users/**").permitAll()
                        .requestMatchers("/login/oauth2/**", "/oauth2/**", "/uploads/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/settings/branding").permitAll()

                        .requestMatchers("/certificates/verify/**").permitAll()
                        .requestMatchers("/security/check-ip").permitAll()
                        .requestMatchers("/auth/password-strength-rules").permitAll()
                        .requestMatchers("/ai/explain").authenticated()
                        .requestMatchers("/ai/**").hasAnyRole("admin", "faculty")
                        .requestMatchers(HttpMethod.GET, "/admin/groups").hasAnyRole("admin", "faculty")
                        .requestMatchers(HttpMethod.POST, "/announcements/**").hasAnyRole("admin", "faculty")
                        .requestMatchers(HttpMethod.PUT, "/announcements/**").hasAnyRole("admin", "faculty")
                        .requestMatchers(HttpMethod.DELETE, "/announcements/**").hasAnyRole("admin", "faculty")
                        .requestMatchers("/faculty/groups/**").hasAnyRole("admin", "faculty")
                        .requestMatchers("/student/groups/**").hasRole("student")
                        .requestMatchers("/admin/**").hasRole("admin")
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2AuthenticationSuccessHandler)
                );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
