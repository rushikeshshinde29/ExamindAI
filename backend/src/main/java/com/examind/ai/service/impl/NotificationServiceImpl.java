package com.examind.ai.service.impl;

import com.examind.ai.entity.Notification;
import com.examind.ai.entity.User;
import com.examind.ai.exception.CustomException;
import com.examind.ai.repository.NotificationRepository;
import com.examind.ai.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final NotificationRepository notificationRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    public Map<String, Object> getNotifications(User user) {
        logger.info("Fetching notifications for user: {}", user.getEmail());
        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<Notification> limitedList = list.stream().limit(30).collect(Collectors.toList());
        long unread = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
        return Map.of("success", true, "data", limitedList, "unread", unread);
    }

    @Override
    public void readNotification(Long id, User user) {
        logger.info("Marking notification ID: {} as read", id);
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new CustomException("Notification not found", HttpStatus.NOT_FOUND));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized access to notification", HttpStatus.FORBIDDEN);
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    public void readAllNotifications(User user) {
        logger.info("Marking all notifications for user {} as read", user.getEmail());
        List<Notification> list = notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(user.getId(), false);
        for (Notification notif : list) {
            notif.setRead(true);
        }
        notificationRepository.saveAll(list);
    }

    @Override
    public void deleteNotification(Long id, User user) {
        logger.info("Deleting notification ID: {}", id);
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new CustomException("Notification not found", HttpStatus.NOT_FOUND));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized access to notification", HttpStatus.FORBIDDEN);
        }

        notificationRepository.delete(notification);
    }
}
