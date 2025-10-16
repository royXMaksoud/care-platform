package com.portal.das.service.profile;

import com.portal.das.domain.model.ChartData;
import com.portal.das.domain.model.ColumnSummary;
import com.portal.das.domain.model.Dataset;
import com.portal.das.domain.model.InferredType;
import com.portal.das.domain.model.UploadedFile;
import com.portal.das.domain.ports.out.dataset.DatasetCrudPort;
import com.portal.das.domain.ports.out.file.FileCrudPort;
import com.portal.das.domain.ports.out.file.FileStoragePort;
import com.sharedlib.core.exception.BadRequestException;
import com.sharedlib.core.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;

import java.io.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for computing column summaries and chart-ready data
 * Similar to pandas describe() and value_counts()
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ColumnSummaryService {

    private final DatasetCrudPort datasetCrudPort;
    private final FileCrudPort fileCrudPort;
    private final FileStoragePort fileStoragePort;
    private final TypeInferenceService typeInferenceService;

    /**
     * Compute summary statistics for a column (pandas describe() style)
     *
     * @param datasetId Dataset identifier
     * @param columnName Column name
     * @return Column summary with statistics
     */
    public ColumnSummary summary(UUID datasetId, String columnName) {
        log.info("Computing summary for column {} in dataset {}", columnName, datasetId);

        // Load dataset and file
        Dataset dataset = datasetCrudPort.load(datasetId)
                .orElseThrow(() -> new NotFoundException("Dataset not found"));
        
        UploadedFile file = fileCrudPort.load(dataset.getFileId())
                .orElseThrow(() -> new NotFoundException("File not found"));

        // Read column values
        List<String> values = readColumnValues(file, columnName);

        // Infer type
        TypeInferenceService.TypeInferenceResult inference = 
                typeInferenceService.inferType(values);

        // Compute statistics
        long count = values.size();
        long nullCount = inference.getNullCount();
        long uniqueCount = countUnique(values);

        // Compute type-specific stats
        ColumnSummary.NumericStats numericStats = null;
        ColumnSummary.StringStats stringStats = null;

        if (inference.getDominantType() == InferredType.INTEGER || 
            inference.getDominantType() == InferredType.DECIMAL) {
            numericStats = computeNumericStats(values);
        } else if (inference.getDominantType() == InferredType.STRING) {
            stringStats = computeStringStats(values);
        }

        // Compute value counts (top 20)
        List<ColumnSummary.ValueCount> topValues = computeValueCounts(values, 20);

        // Sample distincts
        List<String> sampleDistincts = values.stream()
                .filter(v -> v != null && !v.trim().isEmpty())
                .distinct()
                .limit(10)
                .collect(Collectors.toList());

        return ColumnSummary.builder()
                .columnName(columnName)
                .count(count)
                .nullCount(nullCount)
                .uniqueCount(uniqueCount)
                .dominantType(inference.getDominantType().name())
                .numericStats(numericStats)
                .stringStats(stringStats)
                .topValues(topValues)
                .sampleDistincts(sampleDistincts)
                .build();
    }

    /**
     * Generate chart-ready data for a column
     *
     * @param datasetId Dataset identifier
     * @param columnName Column name
     * @return Chart data (histogram, categories, or timeseries)
     */
    public ChartData getChartData(UUID datasetId, String columnName) {
        log.info("Generating chart data for column {} in dataset {}", columnName, datasetId);

        // Load dataset and file
        Dataset dataset = datasetCrudPort.load(datasetId)
                .orElseThrow(() -> new NotFoundException("Dataset not found"));
        
        UploadedFile file = fileCrudPort.load(dataset.getFileId())
                .orElseThrow(() -> new NotFoundException("File not found"));

        // Read column values
        List<String> values = readColumnValues(file, columnName);

        // Infer type
        TypeInferenceService.TypeInferenceResult inference = 
                typeInferenceService.inferType(values);

        InferredType type = inference.getDominantType();

        // Generate appropriate chart data based on type
        ChartData.HistogramData histogram = null;
        ChartData.CategoryData categories = null;
        ChartData.TimeseriesData timeseries = null;

        if (type == InferredType.INTEGER || type == InferredType.DECIMAL) {
            histogram = generateHistogram(values);
        } else if (type == InferredType.DATE || type == InferredType.DATETIME) {
            timeseries = generateTimeseries(values);
        } else {
            categories = generateCategories(values, 20);
        }

        return ChartData.builder()
                .columnName(columnName)
                .dataType(type.name())
                .histogram(histogram)
                .categories(categories)
                .timeseries(timeseries)
                .build();
    }

    /**
     * Read all values for a specific column from file
     */
    private List<String> readColumnValues(UploadedFile file, String columnName) {
        List<String> values = new ArrayList<>();

        try (InputStream inputStream = fileStoragePort.retrieve(file.getStoredFilename());
             Reader reader = new InputStreamReader(inputStream);
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .build()
                     .parse(reader)) {

            for (CSVRecord record : parser) {
                try {
                    String value = record.get(columnName);
                    values.add(value);
                } catch (IllegalArgumentException e) {
                    throw new BadRequestException("Column not found: " + columnName);
                }
            }

        } catch (IOException e) {
            log.error("Failed to read column values", e);
            throw new RuntimeException("Failed to read file");
        }

        return values;
    }

    /**
     * Count unique values
     */
    private long countUnique(List<String> values) {
        return values.stream()
                .filter(v -> v != null && !v.trim().isEmpty())
                .distinct()
                .count();
    }

    /**
     * Compute numeric statistics
     */
    private ColumnSummary.NumericStats computeNumericStats(List<String> values) {
        List<Double> numbers = values.stream()
                .filter(v -> v != null && !v.trim().isEmpty())
                .map(String::trim)
                .map(v -> {
                    try {
                        return Double.parseDouble(v);
                    } catch (NumberFormatException e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .sorted()
                .collect(Collectors.toList());

        if (numbers.isEmpty()) {
            return null;
        }

        double min = numbers.get(0);
        double max = numbers.get(numbers.size() - 1);
        double mean = numbers.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

        // Standard deviation
        double variance = numbers.stream()
                .mapToDouble(n -> Math.pow(n - mean, 2))
                .average()
                .orElse(0.0);
        double std = Math.sqrt(variance);

        // Percentiles
        int size = numbers.size();
        double q25 = numbers.get((int) (size * 0.25));
        double q50 = numbers.get((int) (size * 0.50));
        double q75 = numbers.get((int) (size * 0.75));

        return ColumnSummary.NumericStats.builder()
                .min(min)
                .max(max)
                .mean(mean)
                .std(std)
                .q25(q25)
                .q50(q50)
                .q75(q75)
                .build();
    }

    /**
     * Compute string statistics
     */
    private ColumnSummary.StringStats computeStringStats(List<String> values) {
        List<String> nonNulls = values.stream()
                .filter(v -> v != null && !v.trim().isEmpty())
                .collect(Collectors.toList());

        if (nonNulls.isEmpty()) {
            return null;
        }

        int minLen = nonNulls.stream().mapToInt(String::length).min().orElse(0);
        int maxLen = nonNulls.stream().mapToInt(String::length).max().orElse(0);
        double avgLen = nonNulls.stream().mapToInt(String::length).average().orElse(0.0);

        return ColumnSummary.StringStats.builder()
                .minLength(minLen)
                .maxLength(maxLen)
                .avgLength(avgLen)
                .build();
    }

    /**
     * Compute value counts (top N)
     */
    private List<ColumnSummary.ValueCount> computeValueCounts(List<String> values, int topN) {
        long totalNonNull = values.stream()
                .filter(v -> v != null && !v.trim().isEmpty())
                .count();

        Map<String, Long> counts = values.stream()
                .filter(v -> v != null && !v.trim().isEmpty())
                .collect(Collectors.groupingBy(v -> v, Collectors.counting()));

        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(topN)
                .map(e -> ColumnSummary.ValueCount.builder()
                        .value(e.getKey())
                        .count(e.getValue())
                        .percentage(totalNonNull > 0 ? (e.getValue() * 100.0 / totalNonNull) : 0.0)
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Generate histogram for numeric columns
     */
    private ChartData.HistogramData generateHistogram(List<String> values) {
        List<Double> numbers = values.stream()
                .filter(v -> v != null && !v.trim().isEmpty())
                .map(v -> {
                    try {
                        return Double.parseDouble(v.trim());
                    } catch (NumberFormatException e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (numbers.isEmpty()) {
            return null;
        }

        // Auto binning (Sturges' rule: bins = log2(n) + 1)
        int binCount = (int) Math.ceil(Math.log(numbers.size()) / Math.log(2)) + 1;
        binCount = Math.min(binCount, 50); // Max 50 bins

        double min = numbers.stream().min(Double::compare).orElse(0.0);
        double max = numbers.stream().max(Double::compare).orElse(0.0);
        double binWidth = (max - min) / binCount;

        // Create bins
        List<ChartData.HistogramData.Bin> bins = new ArrayList<>();
        for (int i = 0; i < binCount; i++) {
            final double binStart = min + (i * binWidth);
            final double binEnd = binStart + binWidth;
            final int binIndex = i;
            final int finalBinCount = binCount;
            
            long frequency = numbers.stream()
                    .filter(n -> n >= binStart && (binIndex == finalBinCount - 1 ? n <= binEnd : n < binEnd))
                    .count();

            bins.add(ChartData.HistogramData.Bin.builder()
                    .binStart(binStart)
                    .binEnd(binEnd)
                    .frequency(frequency)
                    .build());
        }

        return ChartData.HistogramData.builder()
                .bins(bins)
                .totalBins(binCount)
                .build();
    }

    /**
     * Generate categories for categorical columns
     */
    private ChartData.CategoryData generateCategories(List<String> values, int topN) {
        Map<String, Long> counts = values.stream()
                .filter(v -> v != null && !v.trim().isEmpty())
                .collect(Collectors.groupingBy(v -> v, Collectors.counting()));

        long total = values.stream()
                .filter(v -> v != null && !v.trim().isEmpty())
                .count();

        List<ChartData.CategoryData.CategoryEntry> categories = counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(topN)
                .map(e -> ChartData.CategoryData.CategoryEntry.builder()
                        .label(e.getKey())
                        .value(e.getValue())
                        .percentage(total > 0 ? (e.getValue() * 100.0 / total) : 0.0)
                        .build())
                .collect(Collectors.toList());

        return ChartData.CategoryData.builder()
                .categories(categories)
                .totalCategories(categories.size())
                .build();
    }

    /**
     * Generate timeseries for date/datetime columns
     */
    private ChartData.TimeseriesData generateTimeseries(List<String> values) {
        final Map<String, Long> counts = new TreeMap<>();

        for (String value : values) {
            if (value == null || value.trim().isEmpty()) {
                continue;
            }

            try {
                // Try to parse as date
                LocalDate date = LocalDate.parse(value.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
                String key = date.toString(); // Group by day
                counts.put(key, counts.getOrDefault(key, 0L) + 1);
            } catch (Exception e) {
                // Skip invalid dates
            }
        }

        List<ChartData.TimeseriesData.TimeseriesPoint> points = counts.entrySet().stream()
                .map(e -> ChartData.TimeseriesData.TimeseriesPoint.builder()
                        .time(e.getKey())
                        .count(e.getValue())
                        .build())
                .collect(Collectors.toList());

        return ChartData.TimeseriesData.builder()
                .points(points)
                .aggregation("daily")
                .build();
    }
}

