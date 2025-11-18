package com.care.warehouse.infrastructure.db.mappers;

import com.care.warehouse.domain.model.Material;
import com.care.warehouse.infrastructure.db.entities.MaterialEntity;
import com.sharedlib.core.persistence.mapper.DomainEntityMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Mapper interface for converting between Material domain model and MaterialEntity.
 * Uses MapStruct for automatic mapping generation.
 * 
 * Handles conversion between:
 * - Material.MaterialDeterminer (domain) ↔ Map<String, Object> (entity JSONB)
 * - Material (domain) ↔ MaterialEntity (JPA)
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface MaterialJpaMapper extends DomainEntityMapper<Material, MaterialEntity> {

    @Override
    @Mapping(target = "determiners", expression = "java(convertDeterminersToMap(domain.getDeterminers()))")
    MaterialEntity toEntity(Material domain);

    @Override
    @Mapping(target = "determiners", expression = "java(convertMapToDeterminers(entity.getDeterminers()))")
    Material toDomain(MaterialEntity entity);

    @Override
    default void updateEntity(@MappingTarget MaterialEntity target, Material source) {
        // Update only the properties that exist in both domain and entity
        if (source == null) {
            return;
        }
        if (source.getCode() != null) target.setCode(source.getCode());
        if (source.getNameTranslations() != null) target.setNameTranslations(source.getNameTranslations());
        if (source.getDescriptionTranslations() != null) target.setDescriptionTranslations(source.getDescriptionTranslations());
        if (source.getCategoryId() != null) target.setCategoryId(source.getCategoryId());
        if (source.getBrandId() != null) target.setBrandId(source.getBrandId());
        if (source.getDeterminers() != null) {
            target.setDeterminers(convertDeterminersToMap(source.getDeterminers()));
        }
        if (source.getIsTrackable() != null) target.setIsTrackable(source.getIsTrackable());
        if (source.getStatus() != null) target.setStatus(source.getStatus());
        if (source.getCustomAttributes() != null) target.setCustomAttributes(source.getCustomAttributes());
        if (source.getReorderLevel() != null) target.setReorderLevel(source.getReorderLevel());
        if (source.getUnit() != null) target.setUnit(source.getUnit());
        if (source.getIsActive() != null) target.setIsActive(source.getIsActive());
        if (source.getIsDeleted() != null) target.setIsDeleted(source.getIsDeleted());
        if (source.getCreatedById() != null) target.setCreatedById(source.getCreatedById());
        if (source.getCreatedAt() != null) target.setCreatedAt(source.getCreatedAt());
        if (source.getUpdatedById() != null) target.setUpdatedById(source.getUpdatedById());
        if (source.getUpdatedAt() != null) target.setUpdatedAt(source.getUpdatedAt());
        if (source.getRowVersion() != null) target.setRowVersion(source.getRowVersion());
    }

    /**
     * Convert List<Material.MaterialDeterminer> to List<Map<String, Object>> for JSONB storage.
     */
    default List<Map<String, Object>> convertDeterminersToMap(List<Material.MaterialDeterminer> determiners) {
        if (determiners == null || determiners.isEmpty()) {
            return null;
        }
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Material.MaterialDeterminer determiner : determiners) {
            Map<String, Object> map = new HashMap<>();
            map.put("type", determiner.getType() != null ? determiner.getType().name() : null);
            map.put("value", determiner.getValue());
            if (determiner.getMetadata() != null && !determiner.getMetadata().isEmpty()) {
                map.put("metadata", determiner.getMetadata());
            }
            result.add(map);
        }
        return result;
    }

    /**
     * Convert List<Map<String, Object>> (from JSONB) to List<Material.MaterialDeterminer>.
     */
    default List<Material.MaterialDeterminer> convertMapToDeterminers(List<Map<String, Object>> determinersMap) {
        if (determinersMap == null || determinersMap.isEmpty()) {
            return null;
        }
        
        List<Material.MaterialDeterminer> result = new ArrayList<>();
        for (Map<String, Object> map : determinersMap) {
            Material.MaterialDeterminer determiner = Material.MaterialDeterminer.builder()
                    .type(parseDeterminerType(map.get("type")))
                    .value((String) map.get("value"))
                    .metadata((Map<String, Object>) map.get("metadata"))
                    .build();
            result.add(determiner);
        }
        return result;
    }

    /**
     * Parse determiner type from string.
     */
    default com.care.warehouse.domain.enums.DeterminerType parseDeterminerType(Object typeObj) {
        if (typeObj == null) {
            return null;
        }
        try {
            return com.care.warehouse.domain.enums.DeterminerType.valueOf(typeObj.toString());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}

