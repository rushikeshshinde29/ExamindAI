package com.examind.ai.service;

import com.examind.ai.entity.User;

public interface InternalUserService {
    User upgradeUser(Long id);
    User getUserById(Long id);
}
