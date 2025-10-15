package com.template.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Application configuration.
 * 
 * This configuration class enables JPA repositories and other application features.
 * 
 * @author Template Team
 * @version 1.0
 * @since 2025-08-06
 */
@Configuration
@EnableJpaRepositories(basePackages = "com.template.infrastructure.adapters.db")
public class ApplicationConfig {
    // Configuration methods can be added here as needed
} 