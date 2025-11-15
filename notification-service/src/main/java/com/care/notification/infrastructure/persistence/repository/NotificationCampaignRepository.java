package com.care.notification.infrastructure.persistence.repository;

import com.care.notification.infrastructure.persistence.entity.NotificationCampaignEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for NotificationCampaign entities
 */
@Repository
public interface NotificationCampaignRepository extends JpaRepository<NotificationCampaignEntity, UUID> {
    
    /**
     * Find campaign by ID and tenant
     */
    Optional<NotificationCampaignEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);
    
    /**
     * Find all campaigns for tenant
     */
    Page<NotificationCampaignEntity> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(
        UUID tenantId, 
        Pageable pageable
    );
    
    /**
     * Find all active campaigns
     */
    @Query("SELECT c FROM NotificationCampaignEntity c WHERE c.tenantId = :tenantId " +
           "AND c.status IN ('ACTIVE', 'PAUSED') AND c.isDeleted = false")
    List<NotificationCampaignEntity> findActiveCampaigns(@Param("tenantId") UUID tenantId);
    
    /**
     * Find campaigns by status
     */
    Page<NotificationCampaignEntity> findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
        UUID tenantId,
        NotificationCampaignEntity.CampaignStatus status,
        Pageable pageable
    );
    
    /**
     * Find scheduled campaigns ready to start
     */
    @Query("SELECT c FROM NotificationCampaignEntity c WHERE c.tenantId = :tenantId " +
           "AND c.status = 'SCHEDULED' AND c.scheduledFor <= :now AND c.isDeleted = false")
    List<NotificationCampaignEntity> findScheduledCampaignsReadyToStart(
        @Param("tenantId") UUID tenantId,
        @Param("now") LocalDateTime now
    );
    
    /**
     * Find campaigns created in date range
     */
    @Query("SELECT c FROM NotificationCampaignEntity c WHERE c.tenantId = :tenantId " +
           "AND c.createdAt >= :startDate AND c.createdAt <= :endDate " +
           "AND c.isDeleted = false ORDER BY c.createdAt DESC")
    List<NotificationCampaignEntity> findCampaignsInDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    /**
     * Find campaigns by notification type
     */
    Page<NotificationCampaignEntity> findByTenantIdAndNotificationTypeAndIsDeletedFalseOrderByCreatedAtDesc(
        UUID tenantId,
        String notificationType,
        Pageable pageable
    );
    
    /**
     * Find campaigns by template
     */
    @Query("SELECT c FROM NotificationCampaignEntity c WHERE c.tenantId = :tenantId " +
           "AND c.templateId = :templateId AND c.isDeleted = false")
    List<NotificationCampaignEntity> findCampaignsByTemplate(
        @Param("tenantId") UUID tenantId,
        @Param("templateId") UUID templateId
    );
    
    /**
     * Count completed campaigns
     */
    @Query("SELECT COUNT(c) FROM NotificationCampaignEntity c WHERE c.tenantId = :tenantId " +
           "AND c.status = 'COMPLETED' AND c.isDeleted = false")
    long countCompletedCampaigns(@Param("tenantId") UUID tenantId);
    
    /**
     * Count failed campaigns
     */
    @Query("SELECT COUNT(c) FROM NotificationCampaignEntity c WHERE c.tenantId = :tenantId " +
           "AND c.status = 'FAILED' AND c.isDeleted = false")
    long countFailedCampaigns(@Param("tenantId") UUID tenantId);
    
    /**
     * Get total notifications sent by campaign
     */
    @Query("SELECT SUM(c.successCount + c.failureCount) FROM NotificationCampaignEntity c " +
           "WHERE c.tenantId = :tenantId AND c.isDeleted = false")
    Long getTotalNotificationsSent(@Param("tenantId") UUID tenantId);
    
    /**
     * Get average success rate across all campaigns
     */
    @Query("SELECT AVG(c.successCount * 100.0 / (c.successCount + c.failureCount)) " +
           "FROM NotificationCampaignEntity c WHERE c.tenantId = :tenantId " +
           "AND c.successCount + c.failureCount > 0 AND c.isDeleted = false")
    Double getAverageSuccessRate(@Param("tenantId") UUID tenantId);
}
