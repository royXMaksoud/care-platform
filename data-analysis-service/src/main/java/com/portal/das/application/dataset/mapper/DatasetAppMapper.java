package com.portal.das.application.dataset.mapper;

import com.portal.das.application.dataset.command.RegisterDatasetCommand;
import com.portal.das.domain.model.Dataset;
import com.portal.das.web.dto.dataset.DatasetInfoResponse;
import com.sharedlib.core.application.mapper.BaseMapper;
import org.springframework.stereotype.Component;

/**
 * Application layer mapper for Dataset operations
 */
@Component
public class DatasetAppMapper implements BaseMapper<Dataset, RegisterDatasetCommand, RegisterDatasetCommand, DatasetInfoResponse> {

    @Override
    public Dataset fromCreate(RegisterDatasetCommand createRequest) {
        // Dataset creation is handled in service
        return null;
    }

    @Override
    public void updateDomain(Dataset target, RegisterDatasetCommand updateRequest) {
        // Update logic handled in service
    }

    @Override
    public DatasetInfoResponse toResponse(Dataset domain) {
        return DatasetInfoResponse.from(domain);
    }
}

