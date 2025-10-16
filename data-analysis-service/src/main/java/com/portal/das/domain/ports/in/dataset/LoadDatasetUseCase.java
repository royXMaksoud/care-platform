package com.portal.das.domain.ports.in.dataset;

import com.portal.das.domain.model.Dataset;

import java.util.UUID;

/**
 * Use case for loading dataset information
 */
public interface LoadDatasetUseCase extends com.sharedlib.core.domain.ports.in.GetByIdUseCase<UUID, Dataset> {
    /**
     * Load dataset by ID
     *
     * @param datasetId Dataset identifier
     * @return Dataset domain object
     */
    default Dataset loadDataset(UUID datasetId) {
        return getById(datasetId);
    }
}


