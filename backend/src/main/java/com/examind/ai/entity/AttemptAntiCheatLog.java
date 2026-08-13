package com.examind.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "attempt_anti_cheat_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AttemptAntiCheatLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    @JsonIgnore
    private Attempt attempt;

    @Column(nullable = false, length = 50)
    private String event; // tab_switch, copy_attempt, fullscreen_exit, right_click

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String details = "";
}
