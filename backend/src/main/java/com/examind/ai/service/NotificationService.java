package com.examind.ai.service;

import com.examind.ai.entity.Notification;
import com.examind.ai.entity.User;
import java.util.List;
import java.util.Map;

public interface NotificationService {
    Map<String, Object> getNotifications(User user);
    void readNotification(Long id, User user);
    void readAllNotifications(User user);
    void deleteNotification(Long id, User user);
}
