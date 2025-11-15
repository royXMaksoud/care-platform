package com.care.notification.presentation.controller;

import com.care.notification.infrastructure.persistence.entity.NotificationTemplateEntity;
import com.care.notification.infrastructure.persistence.repository.NotificationTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/admin/templates")
@RequiredArgsConstructor
@Slf4j
public class AdminTemplateController {
    
    private final NotificationTemplateRepository templateRepository;
    
    @PostMapping
    public ResponseEntity<?> createTemplate(@RequestBody Map<String, Object> request) {
        try {
            String name = (String) request.get("templateName");
            String type = (String) request.get("templateType");
            String notificationType = (String) request.get("notificationType");
            String language = (String) request.get("language");
            String subject = (String) request.get("subject");
            String body = (String) request.get("body");
            
            NotificationTemplateEntity template = NotificationTemplateEntity.builder()
                .id(UUID.randomUUID())
                .templateName(name)
                .templateType(NotificationTemplateEntity.TemplateType.valueOf(type.toUpperCase()))
                .notificationType(notificationType)
                .language(language)
                .subject(subject)
                .body(body)
                .version(1)
                .isActive(true)
                .build();
            
            NotificationTemplateEntity saved = templateRepository.save(template);
            log.info("Template created: {}", saved.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            log.error("Error creating template: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @GetMapping
    public ResponseEntity<?> listTemplates(
        @RequestParam(required = false) String templateType,
        @RequestParam(required = false) String language,
        Pageable pageable) {
        
        try {
            Page<NotificationTemplateEntity> templates = templateRepository.findByIsDeletedFalseOrderByUpdatedAtDesc(pageable);
            return ResponseEntity.ok(templates);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @GetMapping("/{templateId}")
    public ResponseEntity<?> getTemplate(@PathVariable UUID templateId) {
        Optional<NotificationTemplateEntity> template = templateRepository.findById(templateId);
        if (!template.isPresent() || template.get().isDeleted()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(template.get());
    }
    
    @PutMapping("/{templateId}")
    public ResponseEntity<?> updateTemplate(
        @PathVariable UUID templateId,
        @RequestBody Map<String, Object> request) {
        
        try {
            Optional<NotificationTemplateEntity> opt = templateRepository.findById(templateId);
            if (!opt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            NotificationTemplateEntity template = opt.get();
            if (request.containsKey("subject")) {
                template.setSubject((String) request.get("subject"));
            }
            if (request.containsKey("body")) {
                template.setBody((String) request.get("body"));
            }
            
            template.setUpdatedAt(LocalDateTime.now());
            NotificationTemplateEntity updated = templateRepository.save(template);
            log.info("Template updated: {}", templateId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @DeleteMapping("/{templateId}")
    public ResponseEntity<?> deleteTemplate(@PathVariable UUID templateId) {
        try {
            Optional<NotificationTemplateEntity> opt = templateRepository.findById(templateId);
            if (!opt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            NotificationTemplateEntity template = opt.get();
            template.setDeleted(true);
            templateRepository.save(template);
            log.info("Template deleted: {}", templateId);
            return ResponseEntity.ok("Template deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @PostMapping("/{templateId}/activate")
    public ResponseEntity<?> activateTemplate(@PathVariable UUID templateId) {
        try {
            Optional<NotificationTemplateEntity> opt = templateRepository.findById(templateId);
            if (!opt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            NotificationTemplateEntity template = opt.get();
            template.setActive(true);
            template.setUpdatedAt(LocalDateTime.now());
            templateRepository.save(template);
            return ResponseEntity.ok("Template activated");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @PostMapping("/{templateId}/preview")
    public ResponseEntity<?> previewTemplate(
        @PathVariable UUID templateId,
        @RequestBody Map<String, String> variables) {
        
        try {
            Optional<NotificationTemplateEntity> opt = templateRepository.findById(templateId);
            if (!opt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            NotificationTemplateEntity template = opt.get();
            String body = template.getBody();
            
            for (Map.Entry<String, String> var : variables.entrySet()) {
                String key = var.getKey();
                String value = var.getValue();
                body = body.replace("{{" + key + "}}", value);
            }
            
            Map<String, Object> preview = new HashMap<>();
            preview.put("subject", template.getSubject());
            preview.put("body", body);
            preview.put("templateId", templateId);
            return ResponseEntity.ok(preview);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
