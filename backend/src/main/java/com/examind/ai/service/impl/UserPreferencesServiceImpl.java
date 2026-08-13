package com.examind.ai.service.impl;

import com.examind.ai.entity.User;
import com.examind.ai.entity.UserPreferences;
import com.examind.ai.repository.UserPreferencesRepository;
import com.examind.ai.service.UserPreferencesService;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class UserPreferencesServiceImpl implements UserPreferencesService {

    private final UserPreferencesRepository prefRepository;

    public UserPreferencesServiceImpl(UserPreferencesRepository prefRepository) {
        this.prefRepository = prefRepository;
    }

    @Override
    public UserPreferences getPreferences(User user) {
        return getOrCreate(user);
    }

    @Override
    public UserPreferences updatePreferences(User user, Map<String, Object> body) {
        UserPreferences prefs = getOrCreate(user);

        if (body.containsKey("fontSize"))
            prefs.setFontSize(body.get("fontSize").toString());
        if (body.containsKey("colorBlindMode"))
            prefs.setColorBlindMode(Boolean.parseBoolean(body.get("colorBlindMode").toString()));
        if (body.containsKey("soundEffects"))
            prefs.setSoundEffects(Boolean.parseBoolean(body.get("soundEffects").toString()));
        if (body.containsKey("language"))
            prefs.setLanguage(body.get("language").toString());
        if (body.containsKey("keyboardShortcuts"))
            prefs.setKeyboardShortcuts(Boolean.parseBoolean(body.get("keyboardShortcuts").toString()));
        if (body.containsKey("emailNotifications"))
            prefs.setEmailNotifications(Boolean.parseBoolean(body.get("emailNotifications").toString()));
        
        return prefRepository.save(prefs);
    }

    private UserPreferences getOrCreate(User user) {
        return prefRepository.findByUserId(user.getId()).orElseGet(() -> {
            UserPreferences p = new UserPreferences();
            p.setUser(user);
            return prefRepository.save(p);
        });
    }
}
