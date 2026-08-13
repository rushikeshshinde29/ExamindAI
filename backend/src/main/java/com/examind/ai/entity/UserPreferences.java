package com.examind.ai.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_preferences")
@Getter @Setter
public class UserPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnore
    private User user;


    // Font Size: small, medium, large
    @Column(name = "font_size")
    private String fontSize = "medium";

    // Color Blind Mode
    @Column(name = "color_blind_mode")
    private boolean colorBlindMode = false;

    // Sound Effects
    @Column(name = "sound_effects")
    private boolean soundEffects = true;

    // Language: en, hi, mr, ta, te
    private String language = "en";

    // Keyboard Shortcuts
    @Column(name = "keyboard_shortcuts")
    private boolean keyboardShortcuts = true;

    // Email Notifications
    @Column(name = "email_notifications")
    private boolean emailNotifications = true;


    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = LocalDateTime.now(); }
}
