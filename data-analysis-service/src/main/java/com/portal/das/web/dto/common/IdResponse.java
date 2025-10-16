package com.portal.das.web.dto.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Common response DTO containing a single ID
 * Used for create operations that return a generated identifier
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdResponse {
    /**
     * The generated identifier
     */
    private UUID id;

    /**
     * Optional message describing the operation result
     */
    private String message;

    /**
     * Creates a response with just the ID
     *
     * @param id The generated identifier
     * @return IdResponse instance
     */
    public static IdResponse of(UUID id) {
        return IdResponse.builder()
                .id(id)
                .build();
    }

    /**
     * Creates a response with ID and message
     *
     * @param id The generated identifier
     * @param message Description message
     * @return IdResponse instance
     */
    public static IdResponse of(UUID id, String message) {
        return IdResponse.builder()
                .id(id)
                .message(message)
                .build();
    }
}

