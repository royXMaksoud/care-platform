package com.portal.das.web.mapper;

import com.portal.das.domain.model.UploadedFile;
import com.portal.das.web.dto.file.FileInfoResponse;
import com.portal.das.web.dto.file.FileUploadResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Web layer mapper for File DTOs
 * Maps between domain models and web responses
 */
@Component
public class FileWebMapper {

    /**
     * Map domain model to upload response
     */
    public FileUploadResponse toUploadResponse(UploadedFile file) {
        return FileUploadResponse.from(file);
    }

    /**
     * Map list of domain models to upload responses
     */
    public List<FileUploadResponse> toUploadResponses(List<UploadedFile> files) {
        return files.stream()
                .map(this::toUploadResponse)
                .collect(Collectors.toList());
    }

    /**
     * Map domain model to info response
     */
    public FileInfoResponse toInfoResponse(UploadedFile file) {
        return FileInfoResponse.from(file);
    }
}


