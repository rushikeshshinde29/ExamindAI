package com.examind.ai.service;

import com.examind.ai.entity.Bookmark;
import com.examind.ai.entity.User;
import java.util.List;
import java.util.Map;

public interface BookmarkService {
    List<Bookmark> getMyBookmarks(User user);
    Bookmark addBookmark(User user, Long questionId, String note);
    void removeBookmark(User user, Long questionId);
    boolean checkBookmark(User user, Long questionId);
}
