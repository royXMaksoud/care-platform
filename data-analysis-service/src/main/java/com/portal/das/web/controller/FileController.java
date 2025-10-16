package com.portal.das.web.controller;

import com.portal.das.application.file.command.UploadFilesCommand;
import com.portal.das.domain.model.UploadedFile;
import com.portal.das.domain.ports.in.file.DeleteFileUseCase;
import com.portal.das.domain.ports.in.file.LoadFileUseCase;
import com.portal.das.domain.ports.in.file.UploadFileUseCase;
import com.portal.das.web.dto.file.FileInfoResponse;
import com.portal.das.web.dto.file.FileUploadResponse;
import com.portal.das.web.mapper.FileWebMapper;
import com.sharedlib.core.web.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST Controller for File operations
 * Handles file upload, retrieval, and deletion
 */
@Slf4j
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "File Management", description = "APIs for uploading and managing data files")
public class FileController {

    private final UploadFileUseCase uploadFileUseCase;
    private final LoadFileUseCase loadFileUseCase;
    private final DeleteFileUseCase deleteFileUseCase;
    private final FileWebMapper fileWebMapper;

    /**
     * Upload multiple files
     * Accepts CSV, XLSX, XLS files and normalizes them to CSV
     *
     * @param files Files to upload
     * @return List of uploaded file IDs and metadata
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Upload files", description = "Upload multiple CSV or Excel files. Excel files will be converted to CSV.")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ApiResponse<UploadFilesResult> uploadFiles(
            @RequestParam("files") List<MultipartFile> files) {
        
        log.info("Received upload request for {} files", files.size());

        // Create command
        UploadFilesCommand command = UploadFilesCommand.builder()
                .files(files)
                .build();

        // Process files
        List<UploadedFile> uploadedFiles = uploadFileUseCase.uploadFiles(command);

        // Map to response
        List<FileUploadResponse> responses = fileWebMapper.toUploadResponses(uploadedFiles);
        
        // Extract IDs
        List<UUID> fileIds = uploadedFiles.stream()
                .map(UploadedFile::getFileId)
                .collect(Collectors.toList());

        UploadFilesResult result = UploadFilesResult.builder()
                .fileIds(fileIds)
                .files(responses)
                .totalFiles(files.size())
                .successfulUploads((int) uploadedFiles.stream()
                        .filter(f -> f.getStatus() == UploadedFile.FileStatus.PROCESSED)
                        .count())
                .failedUploads((int) uploadedFiles.stream()
                        .filter(f -> f.getStatus() == UploadedFile.FileStatus.ERROR)
                        .count())
                .build();

        return new ApiResponse<>(true, result, "Files uploaded successfully");
    }

    /**
     * Get file information by ID
     *
     * @param fileId File identifier
     * @return File metadata
     */
    @GetMapping("/{fileId}")
    @Operation(summary = "Get file info", description = "Retrieve metadata for a specific file")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ApiResponse<FileInfoResponse> getFileInfo(@PathVariable UUID fileId) {
        log.info("Fetching file info for: {}", fileId);

        UploadedFile file = loadFileUseCase.loadFile(fileId);
        FileInfoResponse response = fileWebMapper.toInfoResponse(file);

        return ApiResponse.ok(response);
    }

    /**
     * Delete a file (soft delete)
     *
     * @param fileId File identifier
     * @return Success message
     */
    @DeleteMapping("/{fileId}")
    @Operation(summary = "Delete file", description = "Soft delete a file (marks as deleted)")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> deleteFile(@PathVariable UUID fileId) {
        log.info("Deleting file: {}", fileId);

        deleteFileUseCase.deleteFile(fileId);

        return ApiResponse.ok("File deleted successfully");
    }

    /**
     * Permanently delete a file
     *
     * @param fileId File identifier
     * @return Success message
     */
    @DeleteMapping("/{fileId}/permanent")
    @Operation(summary = "Permanently delete file", description = "Permanently delete file from storage and database")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> permanentlyDeleteFile(@PathVariable UUID fileId) {
        log.info("Permanently deleting file: {}", fileId);

        deleteFileUseCase.permanentlyDeleteFile(fileId);

        return ApiResponse.ok("File permanently deleted");
    }

    /**
     * Result DTO for file upload operation
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class UploadFilesResult {
        private List<UUID> fileIds;
        private List<FileUploadResponse> files;
        private Integer totalFiles;
        private Integer successfulUploads;
        private Integer failedUploads;
    }
}

