package com.portal.das.application.file.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Command for uploading multiple files
 * Contains the raw file data from the web layer
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadFilesCommand {
    /**
     * Files to upload (from multipart request)
     */
    private List<MultipartFile> files;

    /**
     * Optional description or notes about the upload
     */
    private String description;
}

