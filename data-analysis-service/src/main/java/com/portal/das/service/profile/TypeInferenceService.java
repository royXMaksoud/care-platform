package com.portal.das.service.profile;

import com.portal.das.domain.model.InferredType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

/**
 * Service for inferring data types from string values
 * Similar to pandas type inference with multiple date format support
 */
@Slf4j
@Service
public class TypeInferenceService {

    /**
     * Common date formats to try
     */
    private static final List<DateTimeFormatter> DATE_FORMATTERS = Arrays.asList(
            DateTimeFormatter.ISO_LOCAL_DATE,                // yyyy-MM-dd
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),       // dd/MM/yyyy
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),       // MM/dd/yyyy
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),       // dd-MM-yyyy
            DateTimeFormatter.ofPattern("yyyy/MM/dd"),       // yyyy/MM/dd
            DateTimeFormatter.ofPattern("d/M/yyyy"),         // d/M/yyyy
            DateTimeFormatter.ofPattern("d-M-yyyy")          // d-M-yyyy
    );

    /**
     * Common datetime formats to try
     */
    private static final List<DateTimeFormatter> DATETIME_FORMATTERS = Arrays.asList(
            DateTimeFormatter.ISO_LOCAL_DATE_TIME,                      // yyyy-MM-ddTHH:mm:ss
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),         // yyyy-MM-dd HH:mm:ss
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"),         // dd/MM/yyyy HH:mm:ss
            DateTimeFormatter.ofPattern("MM/dd/yyyy HH:mm:ss"),         // MM/dd/yyyy HH:mm:ss
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),            // yyyy-MM-dd HH:mm
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")             // dd/MM/yyyy HH:mm
    );

    /**
     * Boolean string representations
     */
    private static final Set<String> BOOLEAN_TRUE = Set.of("true", "yes", "1", "t", "y");
    private static final Set<String> BOOLEAN_FALSE = Set.of("false", "no", "0", "f", "n");

    /**
     * Infer the dominant type for a list of values
     *
     * @param values List of string values
     * @return TypeInferenceResult containing type, confidence, and statistics
     */
    public TypeInferenceResult inferType(List<String> values) {
        if (values == null || values.isEmpty()) {
            return TypeInferenceResult.builder()
                    .dominantType(InferredType.STRING)
                    .confidence(0.0)
                    .nullCount(0)
                    .nonNullCount(0)
                    .invalidTypeCount(0)
                    .build();
        }

        Map<InferredType, Integer> typeCounts = new EnumMap<>(InferredType.class);
        int nullCount = 0;
        int nonNullCount = 0;

        for (String value : values) {
            if (isNullOrEmpty(value)) {
                nullCount++;
                continue;
            }

            nonNullCount++;
            InferredType type = inferSingleValue(value);
            typeCounts.put(type, typeCounts.getOrDefault(type, 0) + 1);
        }

        // Find dominant type
        InferredType dominantType = InferredType.STRING;
        int maxCount = 0;
        
        for (Map.Entry<InferredType, Integer> entry : typeCounts.entrySet()) {
            if (entry.getValue() > maxCount) {
                maxCount = entry.getValue();
                dominantType = entry.getKey();
            }
        }

        // Calculate confidence
        double confidence = nonNullCount > 0 ? (double) maxCount / nonNullCount : 0.0;

        // Count invalid values (values that don't match dominant type)
        int invalidTypeCount = nonNullCount - maxCount;

        return TypeInferenceResult.builder()
                .dominantType(dominantType)
                .confidence(confidence)
                .nullCount(nullCount)
                .nonNullCount(nonNullCount)
                .invalidTypeCount(invalidTypeCount)
                .build();
    }

    /**
     * Infer type for a single value
     *
     * @param value String value
     * @return Inferred type
     */
    public InferredType inferSingleValue(String value) {
        if (isNullOrEmpty(value)) {
            return InferredType.STRING;
        }

        // Try boolean first (most specific)
        if (isBoolean(value)) {
            return InferredType.BOOLEAN;
        }

        // Try integer
        if (isInteger(value)) {
            return InferredType.INTEGER;
        }

        // Try decimal
        if (isDecimal(value)) {
            return InferredType.DECIMAL;
        }

        // Try datetime (before date, as datetime is more specific)
        if (isDateTime(value)) {
            return InferredType.DATETIME;
        }

        // Try date
        if (isDate(value)) {
            return InferredType.DATE;
        }

        // Default to string
        return InferredType.STRING;
    }

    /**
     * Check if value is null or empty
     */
    private boolean isNullOrEmpty(String value) {
        return value == null || value.trim().isEmpty() || 
               value.equalsIgnoreCase("null") || value.equalsIgnoreCase("na");
    }

    /**
     * Check if value is a boolean
     */
    private boolean isBoolean(String value) {
        String lower = value.toLowerCase().trim();
        return BOOLEAN_TRUE.contains(lower) || BOOLEAN_FALSE.contains(lower);
    }

    /**
     * Check if value is an integer
     */
    private boolean isInteger(String value) {
        try {
            Long.parseLong(value.trim());
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * Check if value is a decimal number
     */
    private boolean isDecimal(String value) {
        try {
            Double.parseDouble(value.trim());
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * Check if value is a date
     */
    private boolean isDate(String value) {
        String trimmed = value.trim();
        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                LocalDate.parse(trimmed, formatter);
                return true;
            } catch (DateTimeParseException e) {
                // Try next formatter
            }
        }
        return false;
    }

    /**
     * Check if value is a datetime
     */
    private boolean isDateTime(String value) {
        String trimmed = value.trim();
        for (DateTimeFormatter formatter : DATETIME_FORMATTERS) {
            try {
                LocalDateTime.parse(trimmed, formatter);
                return true;
            } catch (DateTimeParseException e) {
                // Try next formatter
            }
        }
        return false;
    }

    /**
     * Result of type inference
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class TypeInferenceResult {
        private InferredType dominantType;
        private Double confidence;
        private Integer nullCount;
        private Integer nonNullCount;
        private Integer invalidTypeCount;
    }
}


