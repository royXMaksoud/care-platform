package com.portal.das.application.file.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Query object for retrieving a file by its ID
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GetFileByIdQuery {
    /**
     * The file identifier to retrieve
     */
    private UUID fileId;

    /**
     * Static factory method for creating query
     *
     * @param fileId File identifier
     * @return Query instance
     */
    public static GetFileByIdQuery of(UUID fileId) {
        return GetFileByIdQuery.builder()
                .fileId(fileId)
                .build();
    }
}

