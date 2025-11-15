package com.care.notification.infrastructure.persistence.repository;

import com.care.notification.infrastructure.persistence.entity.NotificationTemplateEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository for NotificationTemplateEntity
 *
 * Provides database operations for notification templates:
 * - Template lookups by type and language
 * - Active template retrieval
 * - Version control queries
 * - Template management operations
 */
@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplateEntity, UUID> {

    /**
     * Find active template for a notification type and language
     */
    @Query("SELECT t FROM NotificationTemplateEntity t WHERE " +
           "t.notificationType = :notificationType AND " +
           "t.language = :language AND " +
           "t.isActive = true AND " +
           "t.isDeleted = false")
    Optional<NotificationTemplateEntity> findActiveTemplate(
        @Param("notificationType") String notificationType,
        @Param("language") String language
    );

    /**
     * Find active template by template type and notification type
     */
    @Query("SELECT t FROM NotificationTemplateEntity t WHERE " +
           "t.templateType = :templateType AND " +
           "t.notificationType = :notificationType AND " +
           "t.language = :language AND " +
           "t.isActive = true AND " +
           "t.isDeleted = false")
    Optional<NotificationTemplateEntity> findByTypeAndNotificationType(
        @Param("templateType") NotificationTemplateEntity.TemplateType templateType,
        @Param("notificationType") String notificationType,
        @Param("language") String language
    );

    /**
     * Find all active templates for a specific notification type
     */
    @Query("SELECT t FROM NotificationTemplateEntity t WHERE " +
           "t.notificationType = :notificationType AND " +
           "t.isActive = true AND " +
           "t.isDeleted = false " +
           "ORDER BY t.language")
    List<NotificationTemplateEntity> findActiveTemplatesByNotificationType(
        @Param("notificationType") String notificationType
    );

    /**
     * Find all templates by template type
     */
    List<NotificationTemplateEntity> findByTemplateTypeAndIsDeletedFalse(
        NotificationTemplateEntity.TemplateType templateType
    );

    /**
     * Find templates by language
     */
    List<NotificationTemplateEntity> findByLanguageAndIsDeletedFalse(String language);

    /**
     * Find template by name
     */
    Optional<NotificationTemplateEntity> findByTemplateNameAndIsDeletedFalse(String templateName);

    /**
     * Find paginated templates
     */
    Page<NotificationTemplateEntity> findByIsDeletedFalseOrderByUpdatedAtDesc(Pageable pageable);

    /**
     * Find templates by template type and pagination
     */
    Page<NotificationTemplateEntity> findByTemplateTypeAndIsDeletedFalse(
        NotificationTemplateEntity.TemplateType templateType,
        Pageable pageable
    );

    /**
     * Find templates by notification type
     */
    @Query("SELECT t FROM NotificationTemplateEntity t WHERE " +
           "t.notificationType = :notificationType AND " +
           "t.isDeleted = false " +
           "ORDER BY t.language, t.version DESC")
    List<NotificationTemplateEntity> findAllVersionsByNotificationType(
        @Param("notificationType") String notificationType
    );

    /**
     * Find all active email templates
     */
    @Query("SELECT t FROM NotificationTemplateEntity t WHERE " +
           "t.templateType = 'EMAIL' AND " +
           "t.isActive = true AND " +
           "t.isDeleted = false " +
           "ORDER BY t.notificationType, t.language")
    List<NotificationTemplateEntity> findAllActiveEmailTemplates();

    /**
     * Find all active SMS templates
     */
    @Query("SELECT t FROM NotificationTemplateEntity t WHERE " +
           "t.templateType = 'SMS' AND " +
           "t.isActive = true AND " +
           "t.isDeleted = false " +
           "ORDER BY t.notificationType, t.language")
    List<NotificationTemplateEntity> findAllActiveSmsTemplates();

    /**
     * Find all active push templates
     */
    @Query("SELECT t FROM NotificationTemplateEntity t WHERE " +
           "t.templateType = 'PUSH' AND " +
           "t.isActive = true AND " +
           "t.isDeleted = false " +
           "ORDER BY t.notificationType, t.language")
    List<NotificationTemplateEntity> findAllActivePushTemplates();

    /**
     * Find RTL templates (Arabic)
     */
    @Query("SELECT t FROM NotificationTemplateEntity t WHERE " +
           "t.isRtl = true AND " +
           "t.isActive = true AND " +
           "t.isDeleted = false")
    List<NotificationTemplateEntity> findAllRtlTemplates();

    /**
     * Find templates by category
     */
    @Query("SELECT t FROM NotificationTemplateEntity t WHERE " +
           "t.category = :category AND " +
           "t.isActive = true AND " +
           "t.isDeleted = false " +
           "ORDER BY t.notificationType, t.language")
    List<NotificationTemplateEntity> findByCategory(@Param("category") String category);

    /**
     * Find templates modified by a specific user
     */
    @Query("SELECT t FROM NotificationTemplateEntity t WHERE " +
           "t.modifiedBy = :modifiedBy AND " +
           "t.isDeleted = false " +
           "ORDER BY t.updatedAt DESC")
    List<NotificationTemplateEntity> findByModifiedBy(@Param("modifiedBy") String modifiedBy);

    /**
     * Find templates that need variable substitution (contain template variables)
     */
    @Query("SELECT t FROM NotificationTemplateEntity t WHERE " +
           "t.expectedVariables IS NOT NULL AND " +
           "LENGTH(TRIM(t.expectedVariables)) > 0 AND " +
           "t.isActive = true AND " +
           "t.isDeleted = false")
    List<NotificationTemplateEntity> findTemplatesWithVariables();

    /**
     * Count templates by template type
     */
    long countByTemplateTypeAndIsDeletedFalse(NotificationTemplateEntity.TemplateType templateType);

    /**
     * Count templates by notification type
     */
    long countByNotificationTypeAndIsDeletedFalse(String notificationType);

    /**
     * Count templates by language
     */
    long countByLanguageAndIsDeletedFalse(String language);

    /**
     * Get all versions of a template by name
     */
    @Query("SELECT t FROM NotificationTemplateEntity t WHERE " +
           "t.templateName = :templateName AND " +
           "t.isDeleted = false " +
           "ORDER BY t.version DESC")
    List<NotificationTemplateEntity> findAllVersionsByName(@Param("templateName") String templateName);

    /**
     * Find specific version of a template
     */
    @Query("SELECT t FROM NotificationTemplateEntity t WHERE " +
           "t.templateName = :templateName AND " +
           "t.version = :version AND " +
           "t.isDeleted = false")
    Optional<NotificationTemplateEntity> findByNameAndVersion(
        @Param("templateName") String templateName,
        @Param("version") int version
    );

    /**
     * Check if a template with given name exists
     */
    boolean existsByTemplateNameAndIsDeletedFalse(String templateName);

    /**
     * Find templates with pagination by category
     */
    Page<NotificationTemplateEntity> findByCategoryAndIsDeletedFalse(String category, Pageable pageable);

    /**
     * Find all templates with specific expected variables
     */
    @Query("SELECT t FROM NotificationTemplateEntity t WHERE " +
           "t.expectedVariables LIKE %:variable% AND " +
           "t.isDeleted = false")
    List<NotificationTemplateEntity> findByExpectedVariable(@Param("variable") String variable);

    /**
     * Get default system templates (category = 'system')
     */
    @Query("SELECT t FROM NotificationTemplateEntity t WHERE " +
           "t.category = 'system' AND " +
           "t.isActive = true AND " +
           "t.isDeleted = false")
    List<NotificationTemplateEntity> findDefaultSystemTemplates();

    /**
     * Find templates for multi-language campaigns
     */
    @Query("SELECT t FROM NotificationTemplateEntity t WHERE " +
           "t.notificationType = :notificationType AND " +
           "t.templateType = :templateType AND " +
           "t.isActive = true AND " +
           "t.isDeleted = false")
    List<NotificationTemplateEntity> findForMultiLanguageCampaign(
        @Param("notificationType") String notificationType,
        @Param("templateType") NotificationTemplateEntity.TemplateType templateType
    );
}
