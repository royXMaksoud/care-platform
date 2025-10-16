package com.portal.das.application.dataset.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Query object for retrieving a dataset by its ID
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GetDatasetByIdQuery {
    /**
     * The dataset identifier to retrieve
     */
    private UUID datasetId;

    /**
     * Static factory method
     */
    public static GetDatasetByIdQuery of(UUID datasetId) {
        return GetDatasetByIdQuery.builder()
                .datasetId(datasetId)
                .build();
    }
}


