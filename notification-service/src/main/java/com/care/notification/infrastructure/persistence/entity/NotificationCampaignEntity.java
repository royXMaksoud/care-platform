package com.care.notification.infrastructure.persistence.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification_campaigns", indexes = {
    @Index(name = "idx_campaign_status", columnList = "status"),
    @Index(name = "idx_campaign_created_at", columnList = "created_at"),
    @Index(name = "idx_campaign_scheduled_for", columnList = "scheduled_for"),
    @Index(name = "idx_campaign_tenant_id", columnList = "tenant_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationCampaignEntity {
    
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(name = "name", length = 255, nullable = false)
    private String name;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "status", length = 50, nullable = false)
    @Enumerated(EnumType.STRING)
    private CampaignStatus status;
    
    @Column(name = "notification_type", length = 100, nullable = false)
    private String notificationType;
    
    @Column(name = "template_id")
    private UUID templateId;
    
    @Column(name = "preferred_channel", length = 50)
    private String preferredChannel;
    
    @Column(name = "target_beneficiary_count")
    private Integer targetBeneficiaryCount;
    
    @Column(name = "filter_criteria", columnDefinition = "TEXT")
    @JsonIgnore
    private String filterCriteria;
    
    @Column(name = "template_variables", columnDefinition = "TEXT")
    private String templateVariables;
    
    @Column(name = "scheduled_for")
    private LocalDateTime scheduledFor;
    
    @Column(name = "started_at")
    private LocalDateTime startedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    @Column(name = "success_count")
    private Integer successCount;
    
    @Column(name = "failure_count")
    private Integer failureCount;
    
    @Column(name = "error_summary", columnDefinition = "TEXT")
    private String errorSummary;
    
    @Column(name = "created_by", length = 255)
    private String createdBy;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "is_deleted")
    @Builder.Default
    private boolean isDeleted = false;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (status == null) {
            status = CampaignStatus.DRAFT;
        }
        if (successCount == null) {
            successCount = 0;
        }
        if (failureCount == null) {
            failureCount = 0;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum CampaignStatus {
        DRAFT, SCHEDULED, ACTIVE, PAUSED, COMPLETED, FAILED
    }
    
    public boolean isInProgress() {
        return status == CampaignStatus.ACTIVE || status == CampaignStatus.PAUSED;
    }
    
    public double getSuccessRate() {
        int total = (successCount != null ? successCount : 0) + (failureCount != null ? failureCount : 0);
        if (total == 0) return 0.0;
        return ((double) (successCount != null ? successCount : 0) / total) * 100;
    }
    
    public double getProgressPercentage() {
        if (targetBeneficiaryCount == null || targetBeneficiaryCount == 0) {
            return 0.0;
        }
        int processed = (successCount != null ? successCount : 0) + (failureCount != null ? failureCount : 0);
        return ((double) processed / targetBeneficiaryCount) * 100;
    }
}
