package com.care.notification.presentation.controller;

import com.care.notification.infrastructure.persistence.entity.NotificationPreferenceEntity;
import com.care.notification.infrastructure.persistence.repository.NotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/beneficiaries/{beneficiaryId}/notification-preferences")
@RequiredArgsConstructor
@Slf4j
public class NotificationPreferenceController {
    
    private final NotificationPreferenceRepository preferenceRepository;
    
    @GetMapping
    public ResponseEntity<?> getPreferences(@PathVariable UUID beneficiaryId) {
        try {
            Optional<NotificationPreferenceEntity> pref = preferenceRepository
                .findByBeneficiaryId(beneficiaryId);
            
            if (!pref.isPresent()) {
                NotificationPreferenceEntity newPref = NotificationPreferenceEntity.builder()
                    .id(UUID.randomUUID())
                    .beneficiaryId(beneficiaryId)
                    .preferredChannel("EMAIL")
                    .multiChannelEnabled(true)
                    .emailEnabled(true)
                    .smsEnabled(false)
                    .pushEnabled(false)
                    .language("en")
                    .build();
                
                NotificationPreferenceEntity saved = preferenceRepository.save(newPref);
                return ResponseEntity.ok(saved);
            }
            
            return ResponseEntity.ok(pref.get());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @PutMapping
    public ResponseEntity<?> updatePreferences(
        @PathVariable UUID beneficiaryId,
        @RequestBody Map<String, Object> request) {
        
        try {
            Optional<NotificationPreferenceEntity> opt = preferenceRepository
                .findByBeneficiaryId(beneficiaryId);
            
            NotificationPreferenceEntity pref = opt.orElseGet(() -> {
                NotificationPreferenceEntity newPref = new NotificationPreferenceEntity();
                newPref.setId(UUID.randomUUID());
                newPref.setBeneficiaryId(beneficiaryId);
                return newPref;
            });
            
            if (request.containsKey("preferredChannel")) {
                pref.setPreferredChannel((String) request.get("preferredChannel"));
            }
            if (request.containsKey("multiChannelEnabled")) {
                pref.setMultiChannelEnabled((Boolean) request.get("multiChannelEnabled"));
            }
            if (request.containsKey("emailEnabled")) {
                pref.setEmailEnabled((Boolean) request.get("emailEnabled"));
            }
            if (request.containsKey("smsEnabled")) {
                pref.setSmsEnabled((Boolean) request.get("smsEnabled"));
            }
            if (request.containsKey("pushEnabled")) {
                pref.setPushEnabled((Boolean) request.get("pushEnabled"));
            }
            if (request.containsKey("language")) {
                pref.setLanguage((String) request.get("language"));
            }
            if (request.containsKey("allowMarketing")) {
                pref.setAllowMarketing((Boolean) request.get("allowMarketing"));
            }
            
            NotificationPreferenceEntity updated = preferenceRepository.save(pref);
            log.info("Preferences updated for beneficiary: {}", beneficiaryId);
            
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(
        @PathVariable UUID beneficiaryId,
        @RequestBody Map<String, String> request) {
        
        try {
            Optional<NotificationPreferenceEntity> opt = preferenceRepository
                .findByBeneficiaryId(beneficiaryId);
            
            if (!opt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            NotificationPreferenceEntity pref = opt.get();
            String email = (String) request.get("email");
            
            pref.setEmailAddress(email);
            pref.setEmailVerified(true);
            pref.setEmailVerifiedAt(LocalDateTime.now());
            
            preferenceRepository.save(pref);
            log.info("Email verified for beneficiary: {}", beneficiaryId);
            
            return ResponseEntity.ok("Email verified successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @PostMapping("/verify-phone")
    public ResponseEntity<?> verifyPhone(
        @PathVariable UUID beneficiaryId,
        @RequestBody Map<String, String> request) {
        
        try {
            Optional<NotificationPreferenceEntity> opt = preferenceRepository
                .findByBeneficiaryId(beneficiaryId);
            
            if (!opt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            NotificationPreferenceEntity pref = opt.get();
            String phone = (String) request.get("phoneNumber");
            
            pref.setSmsNumber(phone);
            pref.setSmsVerified(true);
            pref.setSmsVerifiedAt(LocalDateTime.now());
            
            preferenceRepository.save(pref);
            log.info("Phone verified for beneficiary: {}", beneficiaryId);
            
            return ResponseEntity.ok("Phone verified successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
