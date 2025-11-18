package com.care.warehouse.infrastructure.db.mappers;

import com.care.warehouse.domain.model.WarehouseMaterialStock;
import com.care.warehouse.infrastructure.db.entities.WarehouseMaterialStockEntity;
import com.sharedlib.core.persistence.mapper.DomainEntityMapper;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

/**
 * Mapper interface for converting between WarehouseMaterialStock domain model and WarehouseMaterialStockEntity.
 * Uses MapStruct for automatic mapping generation.
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface WarehouseMaterialStockJpaMapper extends DomainEntityMapper<WarehouseMaterialStock, WarehouseMaterialStockEntity> {
    
    @Override
    default void updateEntity(@MappingTarget WarehouseMaterialStockEntity target, WarehouseMaterialStock source) {
        if (source == null) {
            return;
        }
        if (source.getMaterialId() != null) target.setMaterialId(source.getMaterialId());
        if (source.getWarehouseId() != null) target.setWarehouseId(source.getWarehouseId());
        if (source.getStockCurrent() != null) target.setStockCurrent(source.getStockCurrent());
        if (source.getStockReserved() != null) target.setStockReserved(source.getStockReserved());
        if (source.getReorderLevel() != null) target.setReorderLevel(source.getReorderLevel());
        if (source.getExpiryDate() != null) target.setExpiryDate(source.getExpiryDate());
        if (source.getLotNumber() != null) target.setLotNumber(source.getLotNumber());
        if (source.getBinLocationCode() != null) target.setBinLocationCode(source.getBinLocationCode());
        if (source.getIsActive() != null) target.setIsActive(source.getIsActive());
        if (source.getIsDeleted() != null) target.setIsDeleted(source.getIsDeleted());
        if (source.getCreatedById() != null) target.setCreatedById(source.getCreatedById());
        if (source.getCreatedAt() != null) target.setCreatedAt(source.getCreatedAt());
        if (source.getUpdatedById() != null) target.setUpdatedById(source.getUpdatedById());
        if (source.getUpdatedAt() != null) target.setUpdatedAt(source.getUpdatedAt());
        if (source.getRowVersion() != null) target.setRowVersion(source.getRowVersion());
    }
}

