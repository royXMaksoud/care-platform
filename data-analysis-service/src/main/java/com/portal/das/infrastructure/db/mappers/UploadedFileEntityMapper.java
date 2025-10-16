package com.portal.das.infrastructure.db.mappers;

import com.portal.das.domain.model.UploadedFile;
import com.portal.das.infrastructure.db.entities.UploadedFileEntity;
import com.sharedlib.core.persistence.mapper.DomainEntityMapper;
import org.springframework.stereotype.Component;

/**
 * Mapper between UploadedFile domain model and UploadedFileEntity
 * Implements bidirectional mapping for persistence layer
 */
@Component
public class UploadedFileEntityMapper implements DomainEntityMapper<UploadedFile, UploadedFileEntity> {

    @Override
    public void updateEntity(UploadedFileEntity target, UploadedFile source) {
        if (source == null || target == null) {
            return;
        }
        
        target.setOriginalFilename(source.getOriginalFilename());
        target.setStoredFilename(source.getStoredFilename());
        target.setStoragePath(source.getStoragePath());
        target.setOriginalFormat(source.getOriginalFormat());
        target.setStoredFormat(source.getStoredFormat());
        target.setOriginalSize(source.getOriginalSize());
        target.setStoredSize(source.getStoredSize());
        target.setMimeType(source.getMimeType());
        target.setRowCount(source.getRowCount());
        target.setColumnCount(source.getColumnCount());
        target.setStatus(mapStatus(source.getStatus()));
        target.setErrorMessage(source.getErrorMessage());
        target.setIsActive(source.getIsActive());
        target.setIsDeleted(source.getIsDeleted());
        target.setUploadedBy(source.getUploadedBy());
        target.setUpdatedBy(source.getUpdatedBy());
        target.setUpdatedAt(source.getUpdatedAt());
    }

    @Override
    public UploadedFileEntity toEntity(UploadedFile domain) {
        if (domain == null) {
            return null;
        }

        return UploadedFileEntity.builder()
                .fileId(domain.getFileId())
                .originalFilename(domain.getOriginalFilename())
                .storedFilename(domain.getStoredFilename())
                .storagePath(domain.getStoragePath())
                .originalFormat(domain.getOriginalFormat())
                .storedFormat(domain.getStoredFormat())
                .originalSize(domain.getOriginalSize())
                .storedSize(domain.getStoredSize())
                .mimeType(domain.getMimeType())
                .rowCount(domain.getRowCount())
                .columnCount(domain.getColumnCount())
                .status(mapStatus(domain.getStatus()))
                .errorMessage(domain.getErrorMessage())
                .isActive(domain.getIsActive())
                .isDeleted(domain.getIsDeleted())
                .uploadedBy(domain.getUploadedBy())
                .uploadedAt(domain.getUploadedAt())
                .updatedBy(domain.getUpdatedBy())
                .updatedAt(domain.getUpdatedAt())
                .rowVersion(domain.getRowVersion())
                .build();
    }

    @Override
    public UploadedFile toDomain(UploadedFileEntity entity) {
        if (entity == null) {
            return null;
        }

        return UploadedFile.builder()
                .fileId(entity.getFileId())
                .originalFilename(entity.getOriginalFilename())
                .storedFilename(entity.getStoredFilename())
                .storagePath(entity.getStoragePath())
                .originalFormat(entity.getOriginalFormat())
                .storedFormat(entity.getStoredFormat())
                .originalSize(entity.getOriginalSize())
                .storedSize(entity.getStoredSize())
                .mimeType(entity.getMimeType())
                .rowCount(entity.getRowCount())
                .columnCount(entity.getColumnCount())
                .status(mapStatus(entity.getStatus()))
                .errorMessage(entity.getErrorMessage())
                .isActive(entity.getIsActive())
                .isDeleted(entity.getIsDeleted())
                .uploadedBy(entity.getUploadedBy())
                .uploadedAt(entity.getUploadedAt())
                .updatedBy(entity.getUpdatedBy())
                .updatedAt(entity.getUpdatedAt())
                .rowVersion(entity.getRowVersion())
                .build();
    }

    /**
     * Map domain FileStatus to entity FileStatus
     */
    private UploadedFileEntity.FileStatus mapStatus(UploadedFile.FileStatus domainStatus) {
        if (domainStatus == null) {
            return null;
        }
        return UploadedFileEntity.FileStatus.valueOf(domainStatus.name());
    }

    /**
     * Map entity FileStatus to domain FileStatus
     */
    private UploadedFile.FileStatus mapStatus(UploadedFileEntity.FileStatus entityStatus) {
        if (entityStatus == null) {
            return null;
        }
        return UploadedFile.FileStatus.valueOf(entityStatus.name());
    }
}

