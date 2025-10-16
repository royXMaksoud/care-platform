package com.portal.das.infrastructure.db.adapter;

import com.portal.das.domain.model.Dataset;
import com.portal.das.domain.ports.out.dataset.DatasetCrudPort;
import com.portal.das.domain.ports.out.dataset.DatasetSearchPort;
import com.portal.das.infrastructure.db.entities.DatasetEntity;
import com.portal.das.infrastructure.db.mappers.DatasetEntityMapper;
import com.portal.das.infrastructure.db.repository.DatasetJpaRepository;
import com.sharedlib.core.filter.FilterRequest;
import com.sharedlib.core.filter.GenericSpecificationBuilder;
import com.sharedlib.core.persistence.adapter.BaseJpaAdapter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Database adapter for Dataset operations
 * Implements both CRUD and Search ports
 */
@Slf4j
@Component
public class DatasetDbAdapter 
        extends BaseJpaAdapter<Dataset, DatasetEntity, UUID, FilterRequest>
        implements DatasetCrudPort, DatasetSearchPort {

    private final DatasetFilterConfig filterConfig;

    public DatasetDbAdapter(DatasetJpaRepository repository,
                           DatasetEntityMapper mapper) {
        super(repository, repository, mapper);
        this.filterConfig = new DatasetFilterConfig();
    }

    @Override
    protected Specification<DatasetEntity> buildSpecification(FilterRequest filter) {
        if (filter == null ||
                ((filter.getCriteria() == null || filter.getCriteria().isEmpty()) &&
                        (filter.getGroups() == null || filter.getGroups().isEmpty()))) {
            return (root, q, cb) -> cb.conjunction();
        }

        return new GenericSpecificationBuilder<DatasetEntity>(filterConfig.getAllowedFields())
                .withCriteria(filter.getCriteria())
                .withGroups(filter.getGroups())
                .withScopes(filter.getScopes())
                .build();
    }

    /**
     * Filter configuration for Dataset
     */
    private static class DatasetFilterConfig {
        private final java.util.Set<String> allowedFields = java.util.Set.of(
                "datasetId", "fileId", "name", "status",
                "createdBy", "createdAt", "isActive", "isDeleted"
        );

        public java.util.Set<String> getAllowedFields() {
            return allowedFields;
        }
    }
}

