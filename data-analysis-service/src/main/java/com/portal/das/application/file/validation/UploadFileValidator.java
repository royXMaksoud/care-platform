package com.portal.das.application.file.validation;

import com.sharedlib.core.exception.BadRequestException;
import com.sharedlib.core.i18n.MessageResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

/**
 * Validator for file upload operations
 * Validates file types, sizes, and content before processing
 */
@Component
@RequiredArgsConstructor
public class UploadFileValidator {
    
    private final MessageResolver messageResolver;

    /**
     * Allowed file extensions
     */
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("csv", "xlsx", "xls");

    /**
     * Maximum file size in bytes (200MB as configured in application.yml)
     */
    private static final long MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB

    /**
     * Validate a single file
     *
     * @param file File to validate
     */
    public void validate(MultipartFile file) {
        // Check if file is empty
        if (file == null || file.isEmpty()) {
            throw new BadRequestException(
                messageResolver.getMessage("das.file.empty")
            );
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException(
                messageResolver.getMessage("das.file.too.large")
            );
        }

        // Get file extension
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.contains(".")) {
            throw new BadRequestException(
                messageResolver.getMessage("das.file.invalid.format")
            );
        }

        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();

        // Validate extension
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException(
                messageResolver.getMessage("das.file.invalid.format")
            );
        }

        // Validate MIME type (additional check)
        String contentType = file.getContentType();
        if (contentType != null && !isAllowedMimeType(contentType)) {
            throw new BadRequestException(
                messageResolver.getMessage("das.file.invalid.format")
            );
        }
    }

    /**
     * Validate multiple files
     *
     * @param files Files to validate
     */
    public void validateAll(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new BadRequestException(
                messageResolver.getMessage("das.file.empty")
            );
        }

        // Validate each file
        for (MultipartFile file : files) {
            validate(file);
        }
    }

    /**
     * Check if MIME type is allowed
     *
     * @param mimeType MIME type to check
     * @return true if allowed
     */
    private boolean isAllowedMimeType(String mimeType) {
        return mimeType.equals("text/csv") ||
               mimeType.equals("application/vnd.ms-excel") ||
               mimeType.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
               mimeType.equals("application/octet-stream"); // Some browsers use this for xlsx
    }
}

