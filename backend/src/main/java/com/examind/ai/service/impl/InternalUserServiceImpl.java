package com.examind.ai.service.impl;

import com.examind.ai.entity.User;
import com.examind.ai.repository.UserRepository;
import com.examind.ai.service.InternalUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class InternalUserServiceImpl implements InternalUserService {

    private static final Logger logger = LoggerFactory.getLogger(InternalUserServiceImpl.class);

    private final UserRepository userRepository;

    public InternalUserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User upgradeUser(Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            logger.warn("Internal upgrade attempt for non-existent user id: {}", id);
            return null;
        }
        user.setPro(true);
        userRepository.saveAndFlush(user);
        logger.info("Successfully upgraded user {} (email: {}) to Pro status internally.", id, user.getEmail());
        return user;
    }

    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }
}
