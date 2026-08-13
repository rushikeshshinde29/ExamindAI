package com.examind.ai.service.impl;

import com.examind.ai.entity.Bookmark;
import com.examind.ai.entity.Question;
import com.examind.ai.entity.User;
import com.examind.ai.exception.CustomException;
import com.examind.ai.repository.BookmarkRepository;
import com.examind.ai.repository.QuestionRepository;
import com.examind.ai.service.BookmarkService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class BookmarkServiceImpl implements BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final QuestionRepository questionRepository;

    public BookmarkServiceImpl(BookmarkRepository bookmarkRepository,
                               QuestionRepository questionRepository) {
        this.bookmarkRepository = bookmarkRepository;
        this.questionRepository = questionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Bookmark> getMyBookmarks(User user) {
        return bookmarkRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @Override
    @Transactional
    public Bookmark addBookmark(User user, Long questionId, String note) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new CustomException("Question not found", HttpStatus.NOT_FOUND));

        if (bookmarkRepository.existsByUserIdAndQuestionId(user.getId(), questionId)) {
            return null; // indicates already bookmarked
        }

        Bookmark bookmark = new Bookmark();
        bookmark.setUser(user);
        bookmark.setQuestion(question);
        bookmark.setNote(note);
        return bookmarkRepository.save(bookmark);
    }

    @Override
    @Transactional
    public void removeBookmark(User user, Long questionId) {
        bookmarkRepository.deleteByUserIdAndQuestionId(user.getId(), questionId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkBookmark(User user, Long questionId) {
        return bookmarkRepository.existsByUserIdAndQuestionId(user.getId(), questionId);
    }
}
