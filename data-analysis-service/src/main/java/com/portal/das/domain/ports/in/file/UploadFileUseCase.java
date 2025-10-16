package com.portal.das.domain.ports.in.file;

import com.portal.das.application.file.command.UploadFilesCommand;
import com.portal.das.domain.model.UploadedFile;

import java.util.List;

/**
 * Use case for uploading files
 * Part of the application's input boundary (Port)
 */
public interface UploadFileUseCase {
    /**
     * Upload multiple files and normalize them to CSV format
     *
     * @param command Command containing files and metadata
     * @return List of uploaded file metadata
     */
    List<UploadedFile> uploadFiles(UploadFilesCommand command);
}

