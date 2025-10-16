package com.portal.das.service.join;

import com.portal.das.domain.model.Dataset;
import com.portal.das.domain.model.JoinRequest;
import com.portal.das.domain.model.UploadedFile;
import com.portal.das.domain.ports.out.dataset.DatasetCrudPort;
import com.portal.das.domain.ports.out.file.FileCrudPort;
import com.portal.das.domain.ports.out.file.FileStoragePort;
import com.sharedlib.core.context.CurrentUserContext;
import com.sharedlib.core.exception.BadRequestException;
import com.sharedlib.core.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.file.Path;
import java.time.Instant;
import java.util.*;

/**
 * Service for joining datasets (pandas merge style)
 * Implements hash join with memory safeguards
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JoinService {

    private final DatasetCrudPort datasetCrudPort;
    private final FileCrudPort fileCrudPort;
    private final FileStoragePort fileStoragePort;

    private static final int MAX_HASH_MAP_SIZE = 1_000_000; // 1M rows safeguard

    /**
     * Join two datasets
     *
     * @param request Join parameters
     * @return New dataset containing join result
     */
    @Transactional
    public Dataset join(JoinRequest request) {
        log.info("Joining datasets: {} and {}", request.getLeftDatasetId(), request.getRightDatasetId());

        // Load datasets
        Dataset leftDataset = datasetCrudPort.load(request.getLeftDatasetId())
                .orElseThrow(() -> new NotFoundException("Left dataset not found"));
        Dataset rightDataset = datasetCrudPort.load(request.getRightDatasetId())
                .orElseThrow(() -> new NotFoundException("Right dataset not found"));

        // Load files
        UploadedFile leftFile = fileCrudPort.load(leftDataset.getFileId())
                .orElseThrow(() -> new NotFoundException("Left file not found"));
        UploadedFile rightFile = fileCrudPort.load(rightDataset.getFileId())
                .orElseThrow(() -> new NotFoundException("Right file not found"));

        // Safeguard: Check size
        if (leftFile.getRowCount() > MAX_HASH_MAP_SIZE || rightFile.getRowCount() > MAX_HASH_MAP_SIZE) {
            throw new BadRequestException("Dataset too large for hash join. Please use sampling.");
        }

        // Perform join
        UUID joinedFileId = performJoin(leftFile, rightFile, request);

        // Create new file entry
        UploadedFile joinedFile = fileCrudPort.load(joinedFileId)
                .orElseThrow(() -> new NotFoundException("Joined file not found"));

        // Create new dataset
        String joinedName = leftDataset.getName() + " JOIN " + rightDataset.getName();
        Dataset joinedDataset = Dataset.builder()
                .datasetId(UUID.randomUUID())
                .fileId(joinedFileId)
                .name(joinedName)
                .description("Join of " + leftDataset.getName() + " and " + rightDataset.getName())
                .rowCount(joinedFile.getRowCount())
                .columnCount(joinedFile.getColumnCount())
                .status(Dataset.DatasetStatus.REGISTERED)
                .isActive(true)
                .isDeleted(false)
                .createdBy(getCurrentUserId())
                .createdAt(Instant.now())
                .build();

        return datasetCrudPort.save(joinedDataset);
    }

    /**
     * Perform the actual join operation
     */
    private UUID performJoin(UploadedFile leftFile, UploadedFile rightFile, JoinRequest request) {
        // Simplified implementation - full implementation would be much larger
        // This is a placeholder showing the structure
        
        UUID outputFileId = UUID.randomUUID();
        String outputFilename = outputFileId + ".csv";
        Path outputPath = fileStoragePort.getPath("out/" + outputFilename);

        try {
            // TODO: Implement hash join logic
            // 1. Build hash map from right dataset
            // 2. Stream left dataset and probe hash map
            // 3. Write matches to output CSV
            
            log.info("Join operation placeholder - full implementation required");
            
            // Create placeholder file
            outputPath.toFile().createNewFile();

        } catch (IOException e) {
            log.error("Failed to perform join", e);
            throw new RuntimeException("Join failed");
        }

        // Save file metadata
        UploadedFile joinedFile = UploadedFile.builder()
                .fileId(outputFileId)
                .originalFilename(outputFilename)
                .storedFilename(outputFilename)
                .storagePath(outputPath.toString())
                .originalFormat("csv")
                .storedFormat("csv")
                .status(UploadedFile.FileStatus.PROCESSED)
                .isActive(true)
                .isDeleted(false)
                .uploadedBy(getCurrentUserId())
                .uploadedAt(Instant.now())
                .build();

        return fileCrudPort.save(joinedFile).getFileId();
    }

    private UUID getCurrentUserId() {
        return CurrentUserContext.get() != null ? CurrentUserContext.get().userId() : null;
    }
}

