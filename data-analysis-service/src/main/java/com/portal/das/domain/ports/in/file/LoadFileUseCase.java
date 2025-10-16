package com.portal.das.domain.ports.in.file;

import com.portal.das.domain.model.UploadedFile;

import java.util.UUID;

/**
 * Use case for loading file information
 * Extends generic LoadUseCase with file-specific operations
 */
public interface LoadFileUseCase extends com.sharedlib.core.domain.ports.in.GetByIdUseCase<UUID, UploadedFile> {
    /**
     * Load file by ID
     *
     * @param fileId File identifier
     * @return UploadedFile domain object
     */
    default UploadedFile loadFile(UUID fileId) {
        return getById(fileId);
    }
}

