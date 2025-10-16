package com.portal.das.domain.ports.in.file;

import java.util.UUID;

/**
 * Use case for deleting files
 * Extends generic DeleteUseCase with file-specific operations
 */
public interface DeleteFileUseCase extends com.sharedlib.core.domain.ports.in.DeleteUseCase<UUID> {
    /**
     * Delete file by ID (soft delete)
     *
     * @param fileId File identifier
     */
    default void deleteFile(UUID fileId) {
        delete(fileId);
    }

    /**
     * Permanently delete file from storage
     *
     * @param fileId File identifier
     */
    void permanentlyDeleteFile(UUID fileId);
}

