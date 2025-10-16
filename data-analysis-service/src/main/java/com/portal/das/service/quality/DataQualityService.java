package com.portal.das.service.quality;

import com.portal.das.domain.model.*;
import com.portal.das.domain.ports.out.dataset.DatasetCrudPort;
import com.portal.das.domain.ports.out.file.FileCrudPort;
import com.portal.das.domain.ports.out.file.FileStoragePort;
import com.sharedlib.core.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Service for data quality validation
 * Discovers errors based on configurable rules
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DataQualityService {

    private final DatasetCrudPort datasetCrudPort;
    private final FileCrudPort fileCrudPort;
    private final FileStoragePort fileStoragePort;

    /**
     * Validate dataset using quality rules
     *
     * @param datasetId Dataset to validate
     * @param rules List of validation rules
     * @param maxViolationsPerRule Maximum violations to track per rule
     * @return Data quality report
     */
    public DataQualityReport validate(UUID datasetId, List<DataQualityRule> rules, int maxViolationsPerRule) {
        log.info("Validating dataset {} with {} rules", datasetId, rules.size());

        // Load dataset and file
        Dataset dataset = datasetCrudPort.load(datasetId)
                .orElseThrow(() -> new NotFoundException("Dataset not found"));
        
        UploadedFile file = fileCrudPort.load(dataset.getFileId())
                .orElseThrow(() -> new NotFoundException("File not found"));

        // Initialize report
        List<DataQualityReport.RuleViolation> ruleViolations = new ArrayList<>();
        long totalRows = 0;
        long totalViolations = 0;

        // Prepare violations CSV
        String violationsCsvFilename = "violations_" + datasetId + ".csv";
        Path violationsCsvPath = Paths.get("storage/out", violationsCsvFilename);
        
        try {
            Files.createDirectories(violationsCsvPath.getParent());
        } catch (IOException e) {
            log.error("Failed to create output directory", e);
        }

        try (InputStream inputStream = fileStoragePort.retrieve(file.getStoredFilename());
             Reader reader = new InputStreamReader(inputStream);
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .build()
                     .parse(reader);
             FileWriter violationsWriter = new FileWriter(violationsCsvPath.toFile());
             CSVPrinter violationsPrinter = new CSVPrinter(violationsWriter, CSVFormat.DEFAULT)) {

            // Write header for violations CSV
            List<String> violationHeaders = new ArrayList<>(Arrays.asList("row_index", "column", "rule_type", "value", "message"));
            violationsPrinter.printRecord(violationHeaders);

            // Validate each rule
            for (DataQualityRule rule : rules) {
                DataQualityReport.RuleViolation violation = validateRule(parser, rule, maxViolationsPerRule, violationsPrinter);
                ruleViolations.add(violation);
                totalViolations += violation.getViolationCount();
            }

            totalRows = file.getRowCount().longValue();

        } catch (IOException e) {
            log.error("Failed to validate dataset", e);
            throw new RuntimeException("Failed to validate dataset");
        }

        return DataQualityReport.builder()
                .datasetId(datasetId)
                .totalRows(totalRows)
                .totalViolations(totalViolations)
                .ruleViolations(ruleViolations)
                .violationsCsvPath(violationsCsvPath.toString())
                .build();
    }

    /**
     * Validate a single rule
     */
    private DataQualityReport.RuleViolation validateRule(
            CSVParser parser, 
            DataQualityRule rule, 
            int maxSamples,
            CSVPrinter violationsPrinter) {
        
        List<Integer> sampleIndexes = new ArrayList<>();
        List<String> sampleValues = new ArrayList<>();
        long violationCount = 0;
        int rowIndex = 0;

        for (CSVRecord record : parser) {
            rowIndex++;
            String value = record.get(rule.getColumn());

            // Check violations
            List<String> violations = checkValue(value, rule);
            
            if (!violations.isEmpty()) {
                violationCount++;

                // Add to samples (limited)
                if (sampleIndexes.size() < maxSamples) {
                    sampleIndexes.add(rowIndex);
                    sampleValues.add(value != null ? value : "NULL");

                    // Write to violations CSV
                    try {
                        for (String violationType : violations) {
                            violationsPrinter.printRecord(
                                    rowIndex,
                                    rule.getColumn(),
                                    violationType,
                                    value != null ? value : "NULL",
                                    "Validation failed: " + violationType
                            );
                        }
                    } catch (IOException e) {
                        log.warn("Failed to write violation to CSV", e);
                    }
                }
            }
        }

        return DataQualityReport.RuleViolation.builder()
                .column(rule.getColumn())
                .ruleType(determineRuleType(rule))
                .violationCount(violationCount)
                .sampleRowIndexes(sampleIndexes)
                .sampleValues(sampleValues)
                .build();
    }

    /**
     * Check a value against a rule
     */
    private List<String> checkValue(String value, DataQualityRule rule) {
        List<String> violations = new ArrayList<>();

        // Check required
        if (Boolean.TRUE.equals(rule.getRequired()) && (value == null || value.trim().isEmpty())) {
            violations.add("REQUIRED");
        }

        if (value == null || value.trim().isEmpty()) {
            return violations; // Skip other checks for null values
        }

        // Check type
        if (rule.getExpectedType() != null) {
            // Type checking logic
        }

        // Check numeric range
        if (rule.getMin() != null || rule.getMax() != null) {
            try {
                double numValue = Double.parseDouble(value.trim());
                if (rule.getMin() != null && numValue < rule.getMin()) {
                    violations.add("MIN_VALUE");
                }
                if (rule.getMax() != null && numValue > rule.getMax()) {
                    violations.add("MAX_VALUE");
                }
            } catch (NumberFormatException e) {
                violations.add("NOT_NUMERIC");
            }
        }

        // Check regex
        if (rule.getRegex() != null) {
            if (!Pattern.matches(rule.getRegex(), value)) {
                violations.add("REGEX_MISMATCH");
            }
        }

        // Check allowed values
        if (rule.getAllowedValues() != null && !rule.getAllowedValues().isEmpty()) {
            if (!rule.getAllowedValues().contains(value)) {
                violations.add("NOT_IN_ALLOWED_VALUES");
            }
        }

        // Check length
        if (rule.getMinLength() != null && value.length() < rule.getMinLength()) {
            violations.add("MIN_LENGTH");
        }
        if (rule.getMaxLength() != null && value.length() > rule.getMaxLength()) {
            violations.add("MAX_LENGTH");
        }

        return violations;
    }

    /**
     * Determine rule type description
     */
    private String determineRuleType(DataQualityRule rule) {
        List<String> types = new ArrayList<>();
        if (Boolean.TRUE.equals(rule.getRequired())) types.add("required");
        if (rule.getExpectedType() != null) types.add("type:" + rule.getExpectedType());
        if (rule.getMin() != null || rule.getMax() != null) types.add("range");
        if (rule.getRegex() != null) types.add("regex");
        if (rule.getAllowedValues() != null) types.add("whitelist");
        if (rule.getMinLength() != null || rule.getMaxLength() != null) types.add("length");
        if (Boolean.TRUE.equals(rule.getUnique())) types.add("unique");
        
        return String.join(", ", types);
    }
}

