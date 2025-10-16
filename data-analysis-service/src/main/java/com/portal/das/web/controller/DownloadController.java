package com.portal.das.web.controller;

import com.portal.das.domain.model.Dataset;
import com.portal.das.domain.model.UploadedFile;
import com.portal.das.domain.ports.out.dataset.DatasetCrudPort;
import com.portal.das.domain.ports.out.file.FileCrudPort;
import com.portal.das.domain.ports.out.file.FileStoragePort;
import com.sharedlib.core.exception.NotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.util.UUID;

/**
 * REST Controller for file downloads and exports
 */
@Slf4j
@RestController
@RequestMapping("/api/datasets")
@RequiredArgsConstructor
@Tag(name = "Download & Export", description = "APIs for downloading datasets and analysis results")
public class DownloadController {

    private final DatasetCrudPort datasetCrudPort;
    private final FileCrudPort fileCrudPort;
    private final FileStoragePort fileStoragePort;

    /**
     * Download dataset as CSV
     * GET /api/datasets/{id}/download
     *
     * @param datasetId Dataset identifier
     * @return CSV file
     */
    @GetMapping("/{id}/download")
    @Operation(summary = "Download dataset", description = "Download dataset as CSV file")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<Resource> downloadDataset(@PathVariable("id") UUID datasetId) {
        log.info("Downloading dataset: {}", datasetId);

        // Load dataset
        Dataset dataset = datasetCrudPort.load(datasetId)
                .orElseThrow(() -> new NotFoundException("Dataset not found"));

        // Load file
        UploadedFile file = fileCrudPort.load(dataset.getFileId())
                .orElseThrow(() -> new NotFoundException("File not found"));

        // Get file stream
        InputStream inputStream = fileStoragePort.retrieve(file.getStoredFilename());

        // Prepare response
        String filename = dataset.getName().replaceAll("[^a-zA-Z0-9.-]", "_") + ".csv";

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
        headers.add(HttpHeaders.CONTENT_TYPE, "text/csv");

        InputStreamResource resource = new InputStreamResource(inputStream);

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(resource);
    }
}

