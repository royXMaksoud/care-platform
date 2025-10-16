package com.portal.das.domain.ports.in.dataset;

import com.portal.das.application.dataset.command.RegisterDatasetCommand;
import com.portal.das.domain.model.Dataset;

/**
 * Use case for registering a dataset from an uploaded file
 * Part of the application's input boundary (Port)
 */
public interface RegisterDatasetUseCase {
    /**
     * Register a dataset from an uploaded file
     * Reads file header, counts rows, computes light profile
     *
     * @param command Command containing file ID and optional name
     * @return Registered dataset with metadata
     */
    Dataset registerDataset(RegisterDatasetCommand command);
}


