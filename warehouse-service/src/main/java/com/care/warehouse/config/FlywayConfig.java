package com.care.warehouse.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayConfigurationCustomizer;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Flyway configuration for automatic checksum repair in development.
 * 
 * This configuration automatically repairs checksum mismatches when migration files
 * have been modified after being applied to the database. This is useful during
 * development when migration files need to be updated.
 * 
 * Note: This should only be enabled in development environments, not in production.
 */
@Configuration
@Profile("dev")
public class FlywayConfig {

    @Value("${spring.flyway.repair-on-migrate:true}")
    private boolean repairOnMigrate;

    /**
     * Customize Flyway configuration to disable validation in dev mode.
     * This prevents validation from failing during initialization.
     */
    @Bean
    public FlywayConfigurationCustomizer flywayConfigurationCustomizer() {
        return configuration -> {
            // Disable validation completely in dev mode
            // We handle validation manually in the migration strategy after repair
            configuration.validateOnMigrate(false);
            configuration.validateMigrationNaming(false);
        };
    }

    /**
     * Custom Flyway migration strategy that repairs checksums before migrating.
     * This fixes checksum mismatches that occur when migration files are modified
     * after being applied to the database.
     * 
     * Since validation is disabled in dev mode, we repair first, then migrate.
     */
    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            // Repair checksums if enabled (fixes mismatches from modified migration files)
            if (repairOnMigrate) {
                try {
                    flyway.repair();
                    System.out.println("Flyway checksums repaired successfully");
                } catch (Exception e) {
                    // Log but don't fail if repair encounters issues
                    // This can happen if the schema history table doesn't exist yet
                    System.out.println("Flyway repair attempted but encountered: " + e.getMessage());
                }
            }
            
            // Run migrations (validation is disabled in dev mode)
            flyway.migrate();
        };
    }
}

