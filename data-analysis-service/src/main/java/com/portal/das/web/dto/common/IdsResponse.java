package com.portal.das.web.dto.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Common response DTO containing multiple IDs
 * Used for batch create operations that return multiple generated identifiers
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdsResponse {
    /**
     * List of generated identifiers
     */
    private List<UUID> ids;

    /**
     * Optional message describing the operation result
     */
    private String message;

    /**
     * Number of successfully created items
     */
    private Integer count;

    /**
     * Creates a response with list of IDs
     *
     * @param ids List of generated identifiers
     * @return IdsResponse instance
     */
    public static IdsResponse of(List<UUID> ids) {
        return IdsResponse.builder()
                .ids(ids)
                .count(ids != null ? ids.size() : 0)
                .build();
    }

    /**
     * Creates a response with IDs and message
     *
     * @param ids List of generated identifiers
     * @param message Description message
     * @return IdsResponse instance
     */
    public static IdsResponse of(List<UUID> ids, String message) {
        return IdsResponse.builder()
                .ids(ids)
                .count(ids != null ? ids.size() : 0)
                .message(message)
                .build();
    }
}

