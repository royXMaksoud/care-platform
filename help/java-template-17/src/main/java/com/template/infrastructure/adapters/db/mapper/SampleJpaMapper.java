package com.template.infrastructure.adapters.db.mapper;

import com.template.domain.model.SampleEntity;
import com.template.infrastructure.adapters.db.entity.SampleJpaEntity;
import org.mapstruct.Mapper;

import java.util.List;

/**
 * MapStruct mapper for converting between SampleEntity and SampleJpaEntity.
 * 
 * This mapper handles the conversion between domain entities and JPA entities.
 * 
 * @author Template Team
 * @version 1.0
 * @since 2025-08-06
 */
@Mapper(componentModel = "spring")
public interface SampleJpaMapper {
    
    /**
     * Convert SampleJpaEntity to SampleEntity.
     * 
     * @param jpaEntity the JPA entity
     * @return the domain entity
     */
    SampleEntity toDomain(SampleJpaEntity jpaEntity);
    
    /**
     * Convert SampleEntity to SampleJpaEntity.
     * 
     * @param domainEntity the domain entity
     * @return the JPA entity
     */
    SampleJpaEntity toJpa(SampleEntity domainEntity);
    
    /**
     * Convert list of SampleJpaEntity to list of SampleEntity.
     * 
     * @param jpaEntities the list of JPA entities
     * @return the list of domain entities
     */
    List<SampleEntity> toDomainList(List<SampleJpaEntity> jpaEntities);
    
    /**
     * Convert list of SampleEntity to list of SampleJpaEntity.
     * 
     * @param domainEntities the list of domain entities
     * @return the list of JPA entities
     */
    List<SampleJpaEntity> toJpaList(List<SampleEntity> domainEntities);
} 