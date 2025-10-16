package com.portal.das.web.dto.dataset;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portal.das.domain.model.Dataset;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for dataset information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DatasetInfoResponse {
    private UUID datasetId;
    private UUID fileId;
    private String name;
    private String description;
    private Integer rowCount;
    private Integer columnCount;
    private List<String> headers;
    private String status;
    private Boolean isActive;
    private UUID createdBy;
    private Instant createdAt;
    private UUID updatedBy;
    private Instant updatedAt;

    /**
     * Create response from domain model
     */
    public static DatasetInfoResponse from(Dataset dataset) {
        return DatasetInfoResponse.builder()
                .datasetId(dataset.getDatasetId())
                .fileId(dataset.getFileId())
                .name(dataset.getName())
                .description(dataset.getDescription())
                .rowCount(dataset.getRowCount())
                .columnCount(dataset.getColumnCount())
                .headers(parseHeaders(dataset.getHeaderJson()))
                .status(dataset.getStatus() != null ? dataset.getStatus().name() : null)
                .isActive(dataset.getIsActive())
                .createdBy(dataset.getCreatedBy())
                .createdAt(dataset.getCreatedAt())
                .updatedBy(dataset.getUpdatedBy())
                .updatedAt(dataset.getUpdatedAt())
                .build();
    }

    /**
     * Parse headers from JSON string
     */
    @SuppressWarnings("unchecked")
    private static List<String> parseHeaders(String headerJson) {
        if (headerJson == null || headerJson.isBlank()) {
            return List.of();
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(headerJson, List.class);
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }
}

