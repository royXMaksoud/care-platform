package com.care.notification.infrastructure.scheduler;

import com.care.notification.infrastructure.persistence.entity.NotificationCampaignEntity;
import com.care.notification.infrastructure.persistence.entity.NotificationEntity;
import com.care.notification.infrastructure.persistence.entity.NotificationEntity.NotificationStatus;
import com.care.notification.infrastructure.persistence.repository.NotificationCampaignRepository;
import com.care.notification.infrastructure.persistence.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class CampaignProgressTracker {
    
    private final NotificationCampaignRepository campaignRepository;
    private final NotificationRepository notificationRepository;
    
    @Scheduled(fixedRate = 30000)
    @Transactional
    public void updateCampaignProgress() {
        try {
            List<NotificationCampaignEntity> activeCampaigns = campaignRepository.findActiveCampaigns(null);
            for (NotificationCampaignEntity campaign : activeCampaigns) {
                updateCampaign(campaign);
            }
        } catch (Exception e) {
            log.error("Error: {}", e.getMessage());
        }
    }
    
    private void updateCampaign(NotificationCampaignEntity campaign) {
        try {
            int success = 0;
            int failure = 0;
            int total = campaign.getTargetBeneficiaryCount() != null ? campaign.getTargetBeneficiaryCount() : 0;
            
            List<NotificationEntity> sent = notificationRepository.findByStatusOrderByCreatedAtDesc(NotificationEntity.NotificationStatus.SENT);
            success = (int) sent.stream().count();
            
            List<NotificationEntity> failed = notificationRepository.findByStatusOrderByCreatedAtDesc(NotificationEntity.NotificationStatus.FAILED);
            failure = (int) failed.stream().count();
            
            campaign.setSuccessCount(success);
            campaign.setFailureCount(failure);
            
            if (success + failure >= total && total > 0) {
                campaign.setStatus(NotificationCampaignEntity.CampaignStatus.COMPLETED);
                campaign.setCompletedAt(LocalDateTime.now());
            }
            
            campaignRepository.save(campaign);
            
        } catch (Exception e) {
            log.error("Error updating campaign {}: {}", campaign.getId(), e.getMessage());
        }
    }
}
