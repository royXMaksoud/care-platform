package com.care.warehouse.infrastructure.db.mappers;

import com.care.warehouse.domain.model.StockTransaction;
import com.care.warehouse.infrastructure.db.entities.StockTransactionEntity;
import com.sharedlib.core.persistence.mapper.DomainEntityMapper;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

/**
 * Mapper interface for converting between StockTransaction domain model and StockTransactionEntity.
 * Uses MapStruct for automatic mapping generation.
 * 
 * @author CARE Team
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface StockTransactionJpaMapper extends DomainEntityMapper<StockTransaction, StockTransactionEntity> {
    
    // MapStruct will automatically map all matching fields
    // transactionId <-> transactionId
    // tenantId <-> tenantId
    // materialId <-> materialId
    // transactionType <-> transactionType (enum mapping)
    // sourceWarehouseId <-> sourceWarehouseId
    // targetWarehouseId <-> targetWarehouseId
    // quantity <-> quantity
    // reason <-> reason (enum mapping)
    // referenceDocument <-> referenceDocument
    // notes <-> notes
    // createdById <-> createdById
    // createdAt <-> createdAt

    @Override
    default void updateEntity(@MappingTarget StockTransactionEntity target, StockTransaction source) {
        if (target == null || source == null) {
            return;
        }

        if (source.getMaterialId() != null) {
            target.setMaterialId(source.getMaterialId());
        }
        if (source.getTransactionType() != null) {
            target.setTransactionType(source.getTransactionType());
        }
        if (source.getSourceWarehouseId() != null) {
            target.setSourceWarehouseId(source.getSourceWarehouseId());
        }
        if (source.getTargetWarehouseId() != null) {
            target.setTargetWarehouseId(source.getTargetWarehouseId());
        }
        if (source.getQuantity() != null) {
            target.setQuantity(source.getQuantity());
        }
        if (source.getReason() != null) {
            target.setReason(source.getReason());
        }
        if (source.getReferenceDocument() != null) {
            target.setReferenceDocument(source.getReferenceDocument());
        }
        if (source.getNotes() != null) {
            target.setNotes(source.getNotes());
        }
        if (source.getCreatedById() != null) {
            target.setCreatedById(source.getCreatedById());
        }
        if (source.getCreatedAt() != null) {
            target.setCreatedAt(source.getCreatedAt());
        }
    }
}

