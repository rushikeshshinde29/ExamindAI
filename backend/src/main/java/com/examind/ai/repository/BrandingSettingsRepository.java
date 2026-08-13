package com.examind.ai.repository;

import com.examind.ai.entity.BrandingSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BrandingSettingsRepository extends JpaRepository<BrandingSettings, Long> {
}
