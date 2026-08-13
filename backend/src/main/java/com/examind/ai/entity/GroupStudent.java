package com.examind.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "group_students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GroupStudent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    @JsonIgnore
    private Group group;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id")
    @JsonProperty("user")
    private User student; // nullable if registration is pending

    @Column(nullable = false, length = 255)
    private String email;

    @Column(nullable = false, length = 20)
    private String status = "pending"; // pending, active, removed

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;
}
