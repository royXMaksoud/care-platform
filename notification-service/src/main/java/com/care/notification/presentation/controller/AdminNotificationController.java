package com.care.notification.presentation.controller;

import com.care.notification.application.service.BulkNotificationService;
import com.care.notification.infrastructure.persistence.entity.NotificationCampaignEntity;
import com.care.notification.infrastructure.persistence.repository.NotificationCampaignRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/admin/notifications")
@RequiredArgsConstructor
@Slf4j
public class AdminNotificationController {
    
    private final NotificationCampaignRepository campaignRepository;
    private final BulkNotificationService bulkNotificationService;
    
    @PostMapping("/campaigns")
    public ResponseEntity<?> createCampaign(
        @RequestBody Map<String, Object> request,
        @RequestHeader("X-Tenant-ID") UUID tenantId) {
        
        try {
            String name = (String) request.get("name");
            String type = (String) request.get("notificationType");
            
            NotificationCampaignEntity campaign = NotificationCampaignEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .name(name)
                .notificationType(type)
                .status(NotificationCampaignEntity.CampaignStatus.DRAFT)
                .build();
            
            NotificationCampaignEntity saved = campaignRepository.save(campaign);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @GetMapping("/campaigns")
    public ResponseEntity<?> listCampaigns(
        @RequestHeader("X-Tenant-ID") UUID tenantId,
        Pageable pageable) {
        
        Page<NotificationCampaignEntity> campaigns = campaignRepository
            .findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId, pageable);
        
        return ResponseEntity.ok(campaigns);
    }
    
    @GetMapping("/campaigns/{campaignId}")
    public ResponseEntity<?> getCampaign(
        @PathVariable UUID campaignId,
        @RequestHeader("X-Tenant-ID") UUID tenantId) {
        
        Optional<NotificationCampaignEntity> campaign = campaignRepository
            .findByIdAndTenantIdAndIsDeletedFalse(campaignId, tenantId);
        
        return campaign.map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    @PostMapping("/campaigns/{campaignId}/send")
    public ResponseEntity<?> sendCampaign(
        @PathVariable UUID campaignId,
        @RequestBody Map<String, Object> request,
        @RequestHeader("X-Tenant-ID") UUID tenantId) {
        
        try {
            Optional<NotificationCampaignEntity> optCampaign = campaignRepository
                .findByIdAndTenantIdAndIsDeletedFalse(campaignId, tenantId);
            
            if (!optCampaign.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            List<UUID> beneficiaryIds = (List<UUID>) request.get("beneficiaryIds");
            bulkNotificationService.startCampaign(optCampaign.get(), beneficiaryIds);
            
            return ResponseEntity.ok("Campaign started");
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @GetMapping("/campaigns/{campaignId}/progress")
    public ResponseEntity<?> getCampaignProgress(
        @PathVariable UUID campaignId,
        @RequestHeader("X-Tenant-ID") UUID tenantId) {
        
        try {
            Map<String, Object> progress = bulkNotificationService.getCampaignProgress(campaignId, tenantId);
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
