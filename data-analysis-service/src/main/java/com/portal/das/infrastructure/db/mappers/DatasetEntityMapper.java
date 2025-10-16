package com.portal.das.infrastructure.db.mappers;

import com.portal.das.domain.model.Dataset;
import com.portal.das.infrastructure.db.entities.DatasetEntity;
import com.sharedlib.core.persistence.mapper.DomainEntityMapper;
import org.springframework.stereotype.Component;

/**
 * Mapper between Dataset domain model and DatasetEntity
 */
@Component
public class DatasetEntityMapper implements DomainEntityMapper<Dataset, DatasetEntity> {

    @Override
    public void updateEntity(DatasetEntity target, Dataset source) {
        if (source == null || target == null) {
            return;
        }

        target.setFileId(source.getFileId());
        target.setName(source.getName());
        target.setDescription(source.getDescription());
        target.setRowCount(source.getRowCount());
        target.setColumnCount(source.getColumnCount());
        target.setHeaderJson(source.getHeaderJson());
        target.setProfileJson(source.getProfileJson());
        target.setStatus(mapStatus(source.getStatus()));
        target.setIsActive(source.getIsActive());
        target.setIsDeleted(source.getIsDeleted());
        target.setCreatedBy(source.getCreatedBy());
        target.setUpdatedBy(source.getUpdatedBy());
        target.setUpdatedAt(source.getUpdatedAt());
    }

    @Override
    public DatasetEntity toEntity(Dataset domain) {
        if (domain == null) {
            return null;
        }

        return DatasetEntity.builder()
                .datasetId(domain.getDatasetId())
                .fileId(domain.getFileId())
                .name(domain.getName())
                .description(domain.getDescription())
                .rowCount(domain.getRowCount())
                .columnCount(domain.getColumnCount())
                .headerJson(domain.getHeaderJson())
                .profileJson(domain.getProfileJson())
                .status(mapStatus(domain.getStatus()))
                .isActive(domain.getIsActive())
                .isDeleted(domain.getIsDeleted())
                .createdBy(domain.getCreatedBy())
                .createdAt(domain.getCreatedAt())
                .updatedBy(domain.getUpdatedBy())
                .updatedAt(domain.getUpdatedAt())
                .rowVersion(domain.getRowVersion())
                .build();
    }

    @Override
    public Dataset toDomain(DatasetEntity entity) {
        if (entity == null) {
            return null;
        }

        return Dataset.builder()
                .datasetId(entity.getDatasetId())
                .fileId(entity.getFileId())
                .name(entity.getName())
                .description(entity.getDescription())
                .rowCount(entity.getRowCount())
                .columnCount(entity.getColumnCount())
                .headerJson(entity.getHeaderJson())
                .profileJson(entity.getProfileJson())
                .status(mapStatus(entity.getStatus()))
                .isActive(entity.getIsActive())
                .isDeleted(entity.getIsDeleted())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedBy(entity.getUpdatedBy())
                .updatedAt(entity.getUpdatedAt())
                .rowVersion(entity.getRowVersion())
                .build();
    }

    /**
     * Map domain status to entity status
     */
    private DatasetEntity.DatasetStatus mapStatus(Dataset.DatasetStatus domainStatus) {
        if (domainStatus == null) {
            return null;
        }
        return DatasetEntity.DatasetStatus.valueOf(domainStatus.name());
    }

    /**
     * Map entity status to domain status
     */
    private Dataset.DatasetStatus mapStatus(DatasetEntity.DatasetStatus entityStatus) {
        if (entityStatus == null) {
            return null;
        }
        return Dataset.DatasetStatus.valueOf(entityStatus.name());
    }
}

