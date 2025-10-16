package com.portal.das.application.dataset.validation;

import com.portal.das.domain.model.UploadedFile;
import com.sharedlib.core.exception.BadRequestException;
import com.sharedlib.core.i18n.MessageResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Validator for dataset registration operations
 */
@Component
@RequiredArgsConstructor
public class RegisterDatasetValidator {

    private final MessageResolver messageResolver;

    /**
     * Validate that file can be used to register a dataset
     *
     * @param file Uploaded file
     */
    public void validate(UploadedFile file) {
        // Check file is processed
        if (file.getStatus() != UploadedFile.FileStatus.PROCESSED) {
            throw new BadRequestException(
                messageResolver.getMessage("das.dataset.file.not.processed")
            );
        }

        // Check file has data
        if (file.getRowCount() == null || file.getRowCount() == 0) {
            throw new BadRequestException(
                messageResolver.getMessage("das.dataset.file.empty")
            );
        }

        // Check file has columns
        if (file.getColumnCount() == null || file.getColumnCount() == 0) {
            throw new BadRequestException(
                messageResolver.getMessage("das.dataset.file.no.columns")
            );
        }
    }
}


