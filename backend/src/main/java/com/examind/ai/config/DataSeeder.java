package com.examind.ai.config;

import com.examind.ai.entity.User;
import com.examind.ai.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        seedUser("prasad.mane.cmfeb26@gmail.com","System Admin", "user@123", "admin");
        seedUser("maneprasad1610@gmail.com", "Dr. Sarah Jenkins", "user@123", "faculty");
        seedUser("cdacwptfeb2026@gmail.com","Alex Johnson", "user@123", "student");
        // Parameter sequence: (email, name, password, role)
    }

    private void seedUser(String email, String name, String rawPassword, String role) {
        if (!userRepository.existsByEmail(email)) {
            logger.info("Seeding default user: {} ({})", name, role);
            User user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setRole(role);
            user.setEmailVerified(true);
            user.setActive(true);
            user.setAvatar("");
            user.setDepartment("Computer Science");
            user.setBio("Default seeded " + role + " account.");
            user.setPhone("1234567890");
            userRepository.save(user);
        }
    }
}
