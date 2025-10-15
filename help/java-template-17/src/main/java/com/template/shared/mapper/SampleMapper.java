package com.template.shared.mapper;

import com.template.domain.model.SampleEntity;
import com.template.shared.dto.SampleDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * MapStruct mapper for converting between SampleEntity and SampleDto.
 * 
 * This mapper handles the conversion between domain entities and DTOs.
 * 
 * @author Template Team
 * @version 1.0
 * @since 2025-08-06
 */
@Mapper(componentModel = "spring")
public interface SampleMapper {
    
    /**
     * Convert SampleEntity to SampleDto.
     * 
     * @param sampleEntity the domain entity
     * @return the DTO
     */
    SampleDto toDto(SampleEntity sampleEntity);
    
    /**
     * Convert SampleDto to SampleEntity.
     * 
     * @param sampleDto the DTO
     * @return the domain entity
     */
    SampleEntity toEntity(SampleDto sampleDto);
    
    /**
     * Convert list of SampleEntity to list of SampleDto.
     * 
     * @param sampleEntities the list of domain entities
     * @return the list of DTOs
     */
    List<SampleDto> toDtoList(List<SampleEntity> sampleEntities);
    
    /**
     * Convert list of SampleDto to list of SampleEntity.
     * 
     * @param sampleDtos the list of DTOs
     * @return the list of domain entities
     */
    List<SampleEntity> toEntityList(List<SampleDto> sampleDtos);
} 