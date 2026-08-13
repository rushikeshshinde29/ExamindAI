package com.examind.ai.service;

import com.examind.ai.entity.Announcement;
import com.examind.ai.entity.User;
import java.util.List;
import java.util.Map;

public interface AnnouncementService {
    List<Announcement> getStudentAnnouncements(User user);
    List<Announcement> getFacultyAnnouncements(User user);
    Announcement createAnnouncement(Map<String, Object> payload, User user);
    Announcement updateAnnouncement(Long id, Map<String, Object> payload, User user);
    void deleteAnnouncement(Long id, User user);
}
