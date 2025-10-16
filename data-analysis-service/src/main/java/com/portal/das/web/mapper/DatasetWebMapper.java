package com.portal.das.web.mapper;

import com.portal.das.application.dataset.command.RegisterDatasetCommand;
import com.portal.das.domain.model.Dataset;
import com.portal.das.web.dto.dataset.DatasetInfoResponse;
import com.portal.das.web.dto.dataset.RegisterDatasetRequest;
import org.springframework.stereotype.Component;

/**
 * Web layer mapper for Dataset DTOs
 */
@Component
public class DatasetWebMapper {

    /**
     * Map request to command
     */
    public RegisterDatasetCommand toCommand(RegisterDatasetRequest request) {
        return RegisterDatasetCommand.builder()
                .fileId(request.getFileId())
                .name(request.getName())
                .description(request.getDescription())
                .build();
    }

    /**
     * Map domain to response
     */
    public DatasetInfoResponse toResponse(Dataset dataset) {
        return DatasetInfoResponse.from(dataset);
    }
}

