package com.examind.ai.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "branding_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BrandingSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "institution_name", nullable = false, length = 150)
    private String institutionName = "Examind AI";

    @Column(name = "logo_url", length = 500)
    private String logoUrl = "/favicon.svg";

    @Column(name = "primary_color", length = 20)
    private String primaryColor = "#7c3aed";

    @Column(name = "secondary_color", length = 20)
    private String secondaryColor = "#0f172a";

    @Column(name = "custom_domain", length = 100)
    private String customDomain = "";
}
