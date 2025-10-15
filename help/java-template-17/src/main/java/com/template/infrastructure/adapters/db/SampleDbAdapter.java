package com.template.infrastructure.adapters.db;

import com.template.domain.model.SampleEntity;
import com.template.domain.port.in.LoadSamplePort;
import com.template.domain.port.out.SaveSamplePort;
import com.template.infrastructure.adapters.db.entity.SampleJpaEntity;
import com.template.infrastructure.adapters.db.mapper.SampleJpaMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Database adapter for SampleEntity operations.
 * 
 * This adapter implements the domain ports for database operations.
 * 
 * @author Template Team
 * @version 1.0
 * @since 2025-08-06
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SampleDbAdapter implements LoadSamplePort, SaveSamplePort {
    
    private final SampleJpaRepository sampleJpaRepository;
    private final SampleJpaMapper sampleJpaMapper;
    
    @Override
    public Optional<SampleEntity> loadById(UUID id) {
        log.debug("Loading sample entity from database with ID: {}", id);
        
        return sampleJpaRepository.findById(id)
                .map(sampleJpaMapper::toDomain);
    }
    
    @Override
    public List<SampleEntity> loadAll() {
        log.debug("Loading all sample entities from database");
        
        return sampleJpaRepository.findAll().stream()
                .map(sampleJpaMapper::toDomain)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<SampleEntity> loadByStatus(String status) {
        log.debug("Loading sample entities from database with status: {}", status);
        
        return sampleJpaRepository.findByStatus(status).stream()
                .map(sampleJpaMapper::toDomain)
                .collect(Collectors.toList());
    }
    
    @Override
    public SampleEntity save(SampleEntity sampleEntity) {
        log.debug("Saving sample entity to database: {}", sampleEntity.getId());
        
        SampleJpaEntity jpaEntity = sampleJpaMapper.toJpa(sampleEntity);
        SampleJpaEntity savedJpaEntity = sampleJpaRepository.save(jpaEntity);
        
        return sampleJpaMapper.toDomain(savedJpaEntity);
    }
    
    @Override
    public SampleEntity update(SampleEntity sampleEntity) {
        log.debug("Updating sample entity in database: {}", sampleEntity.getId());
        
        SampleJpaEntity jpaEntity = sampleJpaMapper.toJpa(sampleEntity);
        SampleJpaEntity updatedJpaEntity = sampleJpaRepository.save(jpaEntity);
        
        return sampleJpaMapper.toDomain(updatedJpaEntity);
    }
    
    @Override
    public void deleteById(UUID id) {
        log.debug("Deleting sample entity from database with ID: {}", id);
        
        sampleJpaRepository.deleteById(id);
    }
} 