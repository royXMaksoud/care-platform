package com.portal.das.domain.ports.in.dataset;

import com.portal.das.domain.model.profile.DatasetProfile;

import java.util.UUID;

/**
 * Use case for retrieving dataset profile
 */
public interface GetDatasetProfileUseCase {
    /**
     * Get dataset profile with column statistics
     *
     * @param datasetId Dataset identifier
     * @return Dataset profile
     */
    DatasetProfile getDatasetProfile(UUID datasetId);
}


