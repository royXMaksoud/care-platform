package com.portal.das.application.file.mapper;

import com.portal.das.application.file.command.UploadFilesCommand;
import com.portal.das.domain.model.UploadedFile;
import com.portal.das.web.dto.file.FileInfoResponse;
import com.sharedlib.core.application.mapper.BaseMapper;
import org.springframework.stereotype.Component;

/**
 * Application layer mapper for File operations
 * Maps between commands and domain objects
 * BaseMapper<Domain, CreateCommand, UpdateCommand, Response>
 */
@Component
public class FileAppMapper implements BaseMapper<UploadedFile, UploadFilesCommand, UploadFilesCommand, FileInfoResponse> {

    @Override
    public UploadedFile fromCreate(UploadFilesCommand createRequest) {
        // File upload creates models differently (from MultipartFile)
        // This is handled in FileServiceImpl
        return null;
    }

    @Override
    public void updateDomain(UploadedFile target, UploadFilesCommand updateRequest) {
        // Update logic handled in service
    }

    @Override
    public FileInfoResponse toResponse(UploadedFile domain) {
        return FileInfoResponse.from(domain);
    }
}
