package com.portal.das.application.dataset.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Command for registering a dataset from an uploaded file
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterDatasetCommand {
    /**
     * The uploaded file ID to create dataset from
     */
    private UUID fileId;

    /**
     * Optional name for the dataset
     * If not provided, will use the original filename
     */
    private String name;

    /**
     * Optional description
     */
    private String description;
}


