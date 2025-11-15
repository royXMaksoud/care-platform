package com.care.notification.application.service;

import com.care.notification.infrastructure.kafka.NotificationEvent;
import com.care.notification.infrastructure.kafka.NotificationEventProducer;
import com.care.notification.infrastructure.persistence.entity.NotificationCampaignEntity;
import com.care.notification.infrastructure.persistence.entity.NotificationEntity;
import com.care.notification.infrastructure.persistence.entity.NotificationEntity.NotificationStatus;
import com.care.notification.infrastructure.persistence.repository.NotificationCampaignRepository;
import com.care.notification.infrastructure.persistence.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BulkNotificationService {
    
    private final NotificationRepository notificationRepository;
    private final NotificationCampaignRepository campaignRepository;
    private final NotificationEventProducer kafkaProducer;
    
    @Value("${app.notification.max-retries:3}")
    private int maxRetries;
    
    @Async
    @Transactional
    public void startCampaign(NotificationCampaignEntity campaign, List<UUID> beneficiaryIds) {
        try {
            log.info("Starting campaign: {} with {} beneficiaries", campaign.getId(), beneficiaryIds.size());
            campaign.setStatus(NotificationCampaignEntity.CampaignStatus.ACTIVE);
            campaign.setStartedAt(LocalDateTime.now());
            campaign.setTargetBeneficiaryCount(beneficiaryIds.size());
            campaignRepository.save(campaign);
            
            int batchSize = 100;
            for (int i = 0; i < beneficiaryIds.size(); i += batchSize) {
                List<UUID> batch = beneficiaryIds.subList(i, Math.min(i + batchSize, beneficiaryIds.size()));
                processBatch(campaign, batch);
            }
            log.info("Campaign {} published", campaign.getId());
        } catch (Exception e) {
            log.error("Error: {}", e.getMessage());
            campaign.setStatus(NotificationCampaignEntity.CampaignStatus.FAILED);
            campaignRepository.save(campaign);
        }
    }
    
    private void processBatch(NotificationCampaignEntity campaign, List<UUID> ids) {
        List<NotificationEntity> notifications = new ArrayList<>();
        for (UUID id : ids) {
            NotificationEntity n = new NotificationEntity();
            n.setId(UUID.randomUUID());
            n.setBeneficiaryId(id);
            n.setStatus(NotificationEntity.NotificationStatus.PENDING);
            n.setMaxRetries(maxRetries);
            notifications.add(n);
        }
        List<NotificationEntity> saved = notificationRepository.saveAll(notifications);
        for (NotificationEntity n : saved) {
            NotificationEvent event = NotificationEvent.fromRequest(n.getId(), null);
            kafkaProducer.publishNotificationEvent(event);
        }
    }
    
    @Transactional
    public void pauseCampaign(UUID campaignId, UUID tenantId) {
        NotificationCampaignEntity c = campaignRepository.findByIdAndTenantIdAndIsDeletedFalse(campaignId, tenantId)
            .orElseThrow(() -> new RuntimeException("Not found"));
        c.setStatus(NotificationCampaignEntity.CampaignStatus.PAUSED);
        campaignRepository.save(c);
    }
    
    @Transactional
    public void resumeCampaign(UUID campaignId, UUID tenantId) {
        NotificationCampaignEntity c = campaignRepository.findByIdAndTenantIdAndIsDeletedFalse(campaignId, tenantId)
            .orElseThrow(() -> new RuntimeException("Not found"));
        c.setStatus(NotificationCampaignEntity.CampaignStatus.ACTIVE);
        campaignRepository.save(c);
    }
    
    public Map<String, Object> getCampaignProgress(UUID campaignId, UUID tenantId) {
        NotificationCampaignEntity c = campaignRepository.findByIdAndTenantIdAndIsDeletedFalse(campaignId, tenantId)
            .orElseThrow(() -> new RuntimeException("Not found"));
        Map<String, Object> progress = new HashMap<>();
        progress.put("campaignId", c.getId());
        progress.put("status", c.getStatus());
        progress.put("totalTarget", c.getTargetBeneficiaryCount());
        progress.put("successCount", c.getSuccessCount());
        progress.put("failureCount", c.getFailureCount());
        progress.put("progressPercentage", c.getProgressPercentage());
        progress.put("successRate", c.getSuccessRate());
        return progress;
    }
}
