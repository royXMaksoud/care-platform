package com.portal.das.application.file.service;

import com.portal.das.application.file.command.UploadFilesCommand;
import com.portal.das.application.file.validation.UploadFileValidator;
import com.portal.das.domain.model.UploadedFile;
import com.portal.das.domain.ports.in.file.DeleteFileUseCase;
import com.portal.das.domain.ports.in.file.LoadFileUseCase;
import com.portal.das.domain.ports.in.file.UploadFileUseCase;
import com.portal.das.domain.ports.out.file.FileCrudPort;
import com.portal.das.domain.ports.out.file.FileStoragePort;
import com.portal.das.util.CsvUtils;
import com.sharedlib.core.context.CurrentUserContext;
import com.sharedlib.core.exception.BadRequestException;
import com.sharedlib.core.exception.NotFoundException;
import com.sharedlib.core.i18n.MessageResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service implementation for File operations
 * Handles file upload, storage, and conversion to CSV
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileServiceImpl implements UploadFileUseCase, LoadFileUseCase, DeleteFileUseCase {

    private final FileCrudPort fileCrudPort;
    private final FileStoragePort fileStoragePort;
    private final UploadFileValidator uploadFileValidator;
    private final MessageResolver messageResolver;

    @Override
    @Transactional
    public List<UploadedFile> uploadFiles(UploadFilesCommand command) {
        log.info("Starting file upload for {} files", command.getFiles().size());

        // Validate all files first
        uploadFileValidator.validateAll(command.getFiles());

        List<UploadedFile> uploadedFiles = new ArrayList<>();

        for (MultipartFile file : command.getFiles()) {
            try {
                UploadedFile uploadedFile = processFile(file);
                uploadedFiles.add(uploadedFile);
                log.info("Successfully processed file: {}", file.getOriginalFilename());
            } catch (Exception e) {
                log.error("Failed to process file: {}", file.getOriginalFilename(), e);
                // Create error record
                UploadedFile errorFile = createErrorFile(file, e.getMessage());
                uploadedFiles.add(errorFile);
            }
        }

        return uploadedFiles;
    }

    /**
     * Process a single file: normalize to CSV and save metadata
     *
     * @param file MultipartFile to process
     * @return UploadedFile metadata
     */
    private UploadedFile processFile(MultipartFile file) throws IOException {
        UUID fileId = UUID.randomUUID();
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        
        // Generate stored filename
        String storedFilename = fileId.toString() + ".csv";
        
        // Create file metadata
        UploadedFile uploadedFile = UploadedFile.builder()
                .fileId(fileId)
                .originalFilename(originalFilename)
                .storedFilename(storedFilename)
                .originalFormat(extension)
                .storedFormat("csv")
                .originalSize(file.getSize())
                .mimeType(file.getContentType())
                .status(UploadedFile.FileStatus.PROCESSING)
                .isActive(true)
                .isDeleted(false)
                .uploadedBy(getCurrentUserId())
                .uploadedAt(Instant.now())
                .build();

        // Convert and store file
        Path storedPath;
        if ("csv".equalsIgnoreCase(extension)) {
            // Already CSV, just store it
            storedPath = fileStoragePort.store(file.getInputStream(), storedFilename);
        } else {
            // Convert Excel to CSV
            storedPath = convertAndStore(file, storedFilename);
        }

        // Update file metadata with stored info
        uploadedFile.setStoragePath(storedPath.toString());
        uploadedFile.setStoredSize(storedPath.toFile().length());

        // Count rows and columns
        try {
            int totalRows = CsvUtils.countRows(storedPath);
            String[] headers = CsvUtils.readHeader(storedPath);
            
            uploadedFile.setRowCount(totalRows > 0 ? totalRows - 1 : 0); // Exclude header
            uploadedFile.setColumnCount(headers.length);
            uploadedFile.setStatus(UploadedFile.FileStatus.PROCESSED);
        } catch (Exception e) {
            log.warn("Failed to read file statistics: {}", e.getMessage());
            uploadedFile.setRowCount(0);
            uploadedFile.setColumnCount(0);
        }

        // Save to database
        return fileCrudPort.save(uploadedFile);
    }

    /**
     * Convert Excel file to CSV and store
     *
     * @param file Excel file
     * @param storedFilename Target filename
     * @return Path where file was stored
     */
    private Path convertAndStore(MultipartFile file, String storedFilename) throws IOException {
        Path tempPath = fileStoragePort.getPath(storedFilename);
        
        try {
            CsvUtils.excelToCsv(file.getInputStream(), tempPath);
            return tempPath;
        } catch (Exception e) {
            log.error("Failed to convert Excel to CSV: {}", e.getMessage(), e);
            throw new BadRequestException(
                messageResolver.getMessage("das.file.conversion.failed")
            );
        }
    }

    /**
     * Create error file record when processing fails
     *
     * @param file Original file
     * @param errorMessage Error message
     * @return UploadedFile with error status
     */
    private UploadedFile createErrorFile(MultipartFile file, String errorMessage) {
        UploadedFile errorFile = UploadedFile.builder()
                .fileId(UUID.randomUUID())
                .originalFilename(file.getOriginalFilename())
                .originalFormat(getFileExtension(file.getOriginalFilename()))
                .originalSize(file.getSize())
                .mimeType(file.getContentType())
                .status(UploadedFile.FileStatus.ERROR)
                .errorMessage(errorMessage)
                .isActive(false)
                .isDeleted(false)
                .uploadedBy(getCurrentUserId())
                .uploadedAt(Instant.now())
                .build();

        return fileCrudPort.save(errorFile);
    }

    @Override
    public UploadedFile getById(UUID fileId) {
        return fileCrudPort.load(fileId)
                .orElseThrow(() -> new NotFoundException(
                    messageResolver.getMessage("das.file.not.found", new Object[]{fileId})
                ));
    }

    @Override
    @Transactional
    public void delete(UUID fileId) {
        UploadedFile file = getById(fileId);
        
        // Soft delete - create updated instance
        UploadedFile updated = UploadedFile.builder()
                .fileId(file.getFileId())
                .originalFilename(file.getOriginalFilename())
                .storedFilename(file.getStoredFilename())
                .storagePath(file.getStoragePath())
                .originalFormat(file.getOriginalFormat())
                .storedFormat(file.getStoredFormat())
                .originalSize(file.getOriginalSize())
                .storedSize(file.getStoredSize())
                .mimeType(file.getMimeType())
                .rowCount(file.getRowCount())
                .columnCount(file.getColumnCount())
                .status(file.getStatus())
                .errorMessage(file.getErrorMessage())
                .isActive(false)
                .isDeleted(true)
                .uploadedBy(file.getUploadedBy())
                .uploadedAt(file.getUploadedAt())
                .updatedBy(getCurrentUserId())
                .updatedAt(Instant.now())
                .rowVersion(file.getRowVersion())
                .build();
        
        fileCrudPort.save(updated);
        log.info("Soft deleted file: {}", fileId);
    }

    @Override
    @Transactional
    public void permanentlyDeleteFile(UUID fileId) {
        UploadedFile file = getById(fileId);
        
        // Delete physical file
        if (file.getStoredFilename() != null) {
            boolean deleted = fileStoragePort.delete(file.getStoredFilename());
            if (!deleted) {
                log.warn("Failed to delete physical file: {}", file.getStoredFilename());
            }
        }
        
        // Delete from database
        fileCrudPort.delete(fileId);
        log.info("Permanently deleted file: {}", fileId);
    }

    /**
     * Extract file extension from filename
     *
     * @param filename Filename
     * @return Extension in lowercase
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * Get current user ID from security context
     *
     * @return User UUID or null
     */
    private UUID getCurrentUserId() {
        return CurrentUserContext.get() != null ? 
               CurrentUserContext.get().userId() : null;
    }
}
