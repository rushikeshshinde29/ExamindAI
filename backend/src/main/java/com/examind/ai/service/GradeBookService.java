package com.examind.ai.service;

import com.examind.ai.entity.User;
import java.util.Map;

public interface GradeBookService {
    Map<String, Object> getFacultyGradeBook(User user);
    Map<String, Object> syncGrades(User user);
}
