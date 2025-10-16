package com.portal.das.infrastructure.db.adapter;

import com.portal.das.domain.model.UploadedFile;
import com.portal.das.domain.ports.out.file.FileCrudPort;
import com.portal.das.domain.ports.out.file.FileSearchPort;
import com.portal.das.infrastructure.db.entities.UploadedFileEntity;
import com.portal.das.infrastructure.db.mappers.UploadedFileEntityMapper;
import com.portal.das.infrastructure.db.repository.UploadedFileJpaRepository;
import com.sharedlib.core.filter.FilterRequest;
import com.sharedlib.core.filter.GenericSpecificationBuilder;
import com.sharedlib.core.persistence.adapter.BaseJpaAdapter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Database adapter for File operations
 * Implements both CRUD and Search ports
 * Bridges domain and infrastructure layers
 */
@Slf4j
@Component
public class FileDbAdapter 
        extends BaseJpaAdapter<UploadedFile, UploadedFileEntity, UUID, FilterRequest>
        implements FileCrudPort, FileSearchPort {

    private final SystemFilterConfig filterConfig;

    public FileDbAdapter(UploadedFileJpaRepository repository,
                        UploadedFileEntityMapper mapper) {
        super(repository, repository, mapper);
        this.filterConfig = new SystemFilterConfig();
    }

    @Override
    protected Specification<UploadedFileEntity> buildSpecification(FilterRequest filter) {
        if (filter == null ||
                ((filter.getCriteria() == null || filter.getCriteria().isEmpty()) &&
                        (filter.getGroups() == null || filter.getGroups().isEmpty()))) {
            return (root, q, cb) -> cb.conjunction();
        }

        return new GenericSpecificationBuilder<UploadedFileEntity>(filterConfig.getAllowedFields())
                .withCriteria(filter.getCriteria())
                .withGroups(filter.getGroups())
                .withScopes(filter.getScopes())
                .build();
    }

    /**
     * Filter configuration for UploadedFile
     */
    private static class SystemFilterConfig {
        private final java.util.Set<String> allowedFields = java.util.Set.of(
                "fileId", "originalFilename", "originalFormat", "status",
                "uploadedBy", "uploadedAt", "isActive", "isDeleted"
        );

        public java.util.Set<String> getAllowedFields() {
            return allowedFields;
        }
    }
}
