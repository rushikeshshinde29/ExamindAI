package com.examind.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "class_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description = "";

    @Column(length = 50)
    private String batch = "";

    @Column(length = 100)
    private String subject = "";

    @Column(length = 50)
    private String semester = "";

    @Column(length = 50)
    private String division = "";

    @Column(name = "is_active")
    private boolean isActive = true;

    // Many-to-Many relationship with Faculty members (Users)
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "group_faculty",
        joinColumns = @JoinColumn(name = "group_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> faculty = new ArrayList<>();

    // Junction list for student membership details
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<GroupStudent> students = new ArrayList<>();

    // Many-to-Many relationship with Quizzes
    @ManyToMany
    @JoinTable(
        name = "group_quizzes",
        joinColumns = @JoinColumn(name = "group_id"),
        inverseJoinColumns = @JoinColumn(name = "quiz_id")
    )
    @JsonIgnore
    private List<Quiz> quizzes = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
