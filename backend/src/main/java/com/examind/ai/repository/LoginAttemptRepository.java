package com.examind.ai.repository;

import com.examind.ai.entity.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {
    Optional<LoginAttempt> findByIpAddress(String ipAddress);
}