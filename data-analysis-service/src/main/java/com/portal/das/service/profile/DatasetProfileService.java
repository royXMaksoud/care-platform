package com.portal.das.service.profile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portal.das.domain.model.UploadedFile;
import com.portal.das.domain.model.profile.DatasetProfile;
import com.portal.das.domain.ports.out.file.FileStoragePort;
import com.sharedlib.core.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for computing dataset profiles
 * Analyzes CSV files and generates column-level statistics
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DatasetProfileService {

    private final FileStoragePort fileStoragePort;
    private final TypeInferenceService typeInferenceService;
    private final ObjectMapper objectMapper;

    /**
     * Compute profile for a dataset from its source file
     *
     * @param file Source file
     * @return DatasetProfile with column statistics
     */
    public DatasetProfile computeProfile(UploadedFile file) {
        log.info("Computing profile for file: {}", file.getFileId());

        try (InputStream inputStream = fileStoragePort.retrieve(file.getStoredFilename());
             Reader reader = new InputStreamReader(inputStream);
             CSVParser parser = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build().parse(reader)) {

            // Get headers
            Map<String, Integer> headerMap = parser.getHeaderMap();
            List<String> headers = new ArrayList<>(headerMap.keySet());

            // Collect values for each column
            Map<String, List<String>> columnValues = new HashMap<>();
            for (String header : headers) {
                columnValues.put(header, new ArrayList<>());
            }

            // Read all records and collect column values
            for (CSVRecord record : parser) {
                for (String header : headers) {
                    String value = record.get(header);
                    columnValues.get(header).add(value);
                }
            }

            // Compute profile for each column
            List<DatasetProfile.ColumnProfile> columnProfiles = new ArrayList<>();
            int colIndex = 0;

            for (String header : headers) {
                List<String> values = columnValues.get(header);
                
                // Infer type
                TypeInferenceService.TypeInferenceResult inference = 
                        typeInferenceService.inferType(values);

                // Get examples (first 5 non-null values)
                List<String> examples = values.stream()
                        .filter(v -> v != null && !v.trim().isEmpty())
                        .limit(5)
                        .collect(Collectors.toList());

                DatasetProfile.ColumnProfile colProfile = DatasetProfile.ColumnProfile.builder()
                        .columnName(header)
                        .columnIndex(colIndex++)
                        .dominantType(inference.getDominantType().name())
                        .confidence(inference.getConfidence())
                        .nullCount(inference.getNullCount())
                        .nonNullCount(inference.getNonNullCount())
                        .invalidTypeCount(inference.getInvalidTypeCount())
                        .examples(examples)
                        .build();

                columnProfiles.add(colProfile);
            }

            return DatasetProfile.builder()
                    .totalRows(file.getRowCount())
                    .totalColumns(file.getColumnCount())
                    .columns(columnProfiles)
                    .build();

        } catch (IOException e) {
            log.error("Failed to compute profile for file: {}", file.getFileId(), e);
            throw new BadRequestException("Failed to read file for profiling");
        }
    }

    /**
     * Convert profile to JSON string
     *
     * @param profile Dataset profile
     * @return JSON string representation
     */
    public String profileToJson(DatasetProfile profile) {
        try {
            return objectMapper.writeValueAsString(profile);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize profile to JSON", e);
            return "{}";
        }
    }

    /**
     * Parse profile from JSON string
     *
     * @param profileJson JSON string
     * @return DatasetProfile object
     */
    public DatasetProfile profileFromJson(String profileJson) {
        try {
            return objectMapper.readValue(profileJson, DatasetProfile.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize profile from JSON", e);
            return null;
        }
    }
}


