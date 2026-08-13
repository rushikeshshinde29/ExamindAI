package com.examind.ai.service;

import com.examind.ai.entity.Group;
import com.examind.ai.entity.User;
import java.util.List;
import java.util.Map;

public interface GroupService {
    List<Group> getFacultyGroups(User user);
    List<User> getAllActiveFaculty();
    List<Map<String, Object>> getStudentGroups(User user);
    Group validateAndGetGroup(Long groupId, User user);
}
