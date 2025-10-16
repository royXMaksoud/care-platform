package com.portal.das.application.dataset.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portal.das.application.dataset.command.RegisterDatasetCommand;
import com.portal.das.application.dataset.validation.RegisterDatasetValidator;
import com.portal.das.domain.model.Dataset;
import com.portal.das.domain.model.UploadedFile;
import com.portal.das.domain.model.profile.DatasetProfile;
import com.portal.das.domain.ports.in.dataset.GetDatasetProfileUseCase;
import com.portal.das.domain.ports.in.dataset.LoadDatasetUseCase;
import com.portal.das.domain.ports.in.dataset.RegisterDatasetUseCase;
import com.portal.das.domain.ports.out.dataset.DatasetCrudPort;
import com.portal.das.domain.ports.out.file.FileCrudPort;
import com.portal.das.service.profile.DatasetProfileService;
import com.portal.das.util.CsvUtils;
import com.sharedlib.core.context.CurrentUserContext;
import com.sharedlib.core.exception.NotFoundException;
import com.sharedlib.core.i18n.MessageResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Paths;
import java.time.Instant;
import java.util.Arrays;
import java.util.UUID;

/**
 * Service implementation for Dataset operations
 * Handles dataset registration and profiling
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DatasetServiceImpl implements RegisterDatasetUseCase, LoadDatasetUseCase, GetDatasetProfileUseCase {

    private final DatasetCrudPort datasetCrudPort;
    private final FileCrudPort fileCrudPort;
    private final DatasetProfileService profileService;
    private final RegisterDatasetValidator validator;
    private final MessageResolver messageResolver;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public Dataset registerDataset(RegisterDatasetCommand command) {
        log.info("Registering dataset from file: {}", command.getFileId());

        // Load file
        UploadedFile file = fileCrudPort.load(command.getFileId())
                .orElseThrow(() -> new NotFoundException(
                    messageResolver.getMessage("das.file.not.found", new Object[]{command.getFileId()})
                ));

        // Validate file
        validator.validate(file);

        // Read header from file
        String[] headers;
        try {
            headers = CsvUtils.readHeader(Paths.get(file.getStoragePath()));
        } catch (Exception e) {
            log.error("Failed to read file header", e);
            throw new NotFoundException(
                messageResolver.getMessage("das.dataset.file.unreadable")
            );
        }

        // Determine dataset name
        String datasetName = command.getName() != null && !command.getName().isBlank() 
                ? command.getName() 
                : file.getOriginalFilename();

        // Create dataset
        Dataset dataset = Dataset.builder()
                .datasetId(UUID.randomUUID())
                .fileId(file.getFileId())
                .name(datasetName)
                .description(command.getDescription())
                .rowCount(file.getRowCount())
                .columnCount(file.getColumnCount())
                .headerJson(headersToJson(headers))
                .status(Dataset.DatasetStatus.PROFILING)
                .isActive(true)
                .isDeleted(false)
                .createdBy(getCurrentUserId())
                .createdAt(Instant.now())
                .build();

        // Save dataset
        Dataset saved = datasetCrudPort.save(dataset);

        // Compute profile in background (for now, do it synchronously)
        try {
            DatasetProfile profile = profileService.computeProfile(file);
            String profileJson = profileService.profileToJson(profile);

            // Update dataset with profile
            Dataset updated = Dataset.builder()
                    .datasetId(saved.getDatasetId())
                    .fileId(saved.getFileId())
                    .name(saved.getName())
                    .description(saved.getDescription())
                    .rowCount(saved.getRowCount())
                    .columnCount(saved.getColumnCount())
                    .headerJson(saved.getHeaderJson())
                    .profileJson(profileJson)
                    .status(Dataset.DatasetStatus.PROFILED)
                    .isActive(saved.getIsActive())
                    .isDeleted(saved.getIsDeleted())
                    .createdBy(saved.getCreatedBy())
                    .createdAt(saved.getCreatedAt())
                    .updatedBy(getCurrentUserId())
                    .updatedAt(Instant.now())
                    .rowVersion(saved.getRowVersion())
                    .build();

            saved = datasetCrudPort.save(updated);
            log.info("Dataset profile computed successfully for dataset: {}", saved.getDatasetId());
        } catch (Exception e) {
            log.error("Failed to compute profile for dataset: {}", saved.getDatasetId(), e);
            // Mark as error but don't fail the registration
            Dataset errorDataset = Dataset.builder()
                    .datasetId(saved.getDatasetId())
                    .fileId(saved.getFileId())
                    .name(saved.getName())
                    .description(saved.getDescription())
                    .rowCount(saved.getRowCount())
                    .columnCount(saved.getColumnCount())
                    .headerJson(saved.getHeaderJson())
                    .status(Dataset.DatasetStatus.ERROR)
                    .isActive(saved.getIsActive())
                    .isDeleted(saved.getIsDeleted())
                    .createdBy(saved.getCreatedBy())
                    .createdAt(saved.getCreatedAt())
                    .rowVersion(saved.getRowVersion())
                    .build();
            saved = datasetCrudPort.save(errorDataset);
        }

        return saved;
    }

    @Override
    public Dataset getById(UUID datasetId) {
        return datasetCrudPort.load(datasetId)
                .orElseThrow(() -> new NotFoundException(
                    messageResolver.getMessage("das.dataset.not.found", new Object[]{datasetId})
                ));
    }

    @Override
    public DatasetProfile getDatasetProfile(UUID datasetId) {
        Dataset dataset = getById(datasetId);

        if (dataset.getProfileJson() == null || dataset.getProfileJson().isBlank()) {
            throw new NotFoundException(
                messageResolver.getMessage("das.dataset.profile.not.found")
            );
        }

        return profileService.profileFromJson(dataset.getProfileJson());
    }

    /**
     * Convert headers array to JSON string
     *
     * @param headers Array of column names
     * @return JSON string
     */
    private String headersToJson(String[] headers) {
        try {
            return objectMapper.writeValueAsString(Arrays.asList(headers));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize headers to JSON", e);
            return "[]";
        }
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

