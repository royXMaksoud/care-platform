package com.portal.das.service.forecast;

import com.portal.das.domain.model.*;
import com.portal.das.domain.ports.out.dataset.DatasetCrudPort;
import com.portal.das.domain.ports.out.file.FileCrudPort;
import com.portal.das.domain.ports.out.file.FileStoragePort;
import com.sharedlib.core.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for time series forecasting
 * Implements lightweight forecasting methods (moving average, seasonal naive)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ForecastService {

    private final DatasetCrudPort datasetCrudPort;
    private final FileCrudPort fileCrudPort;
    private final FileStoragePort fileStoragePort;

    /**
     * Generate forecast preview for a dataset
     *
     * @param datasetId Dataset identifier
     * @param request Forecast parameters
     * @return Forecast result with actual and predicted values
     */
    public ForecastResult preview(UUID datasetId, ForecastRequest request) {
        log.info("Generating forecast for dataset {}, columns: {} -> {}", 
                datasetId, request.getDateColumn(), request.getValueColumn());

        // Load dataset and file
        Dataset dataset = datasetCrudPort.load(datasetId)
                .orElseThrow(() -> new NotFoundException("Dataset not found"));
        
        UploadedFile file = fileCrudPort.load(dataset.getFileId())
                .orElseThrow(() -> new NotFoundException("File not found"));

        // Read time series data
        List<ForecastResult.DataPoint> timeSeries = readTimeSeries(file, request);

        if (timeSeries.isEmpty()) {
            throw new NotFoundException("No valid time series data found");
        }

        // Get actual tail (last 20 points)
        int tailSize = Math.min(20, timeSeries.size());
        List<ForecastResult.DataPoint> actualTail = timeSeries.subList(
                Math.max(0, timeSeries.size() - tailSize), timeSeries.size());

        // Generate forecast
        List<ForecastResult.DataPoint> forecast = generateForecast(timeSeries, request);

        // Create chart-ready data
        List<ForecastResult.ChartPoint> chartData = new ArrayList<>();
        
        // Add actual tail
        for (ForecastResult.DataPoint point : actualTail) {
            chartData.add(ForecastResult.ChartPoint.builder()
                    .time(point.getTime())
                    .value(point.getValue())
                    .type("actual")
                    .build());
        }
        
        // Add forecast
        for (ForecastResult.DataPoint point : forecast) {
            chartData.add(ForecastResult.ChartPoint.builder()
                    .time(point.getTime())
                    .value(point.getValue())
                    .type("forecast")
                    .build());
        }

        return ForecastResult.builder()
                .actualTail(actualTail)
                .forecast(forecast)
                .chartData(chartData)
                .build();
    }

    /**
     * Read time series data from file
     */
    private List<ForecastResult.DataPoint> readTimeSeries(UploadedFile file, ForecastRequest request) {
        List<ForecastResult.DataPoint> points = new ArrayList<>();

        try (InputStream inputStream = fileStoragePort.retrieve(file.getStoredFilename());
             Reader reader = new InputStreamReader(inputStream);
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .build()
                     .parse(reader)) {

            for (CSVRecord record : parser) {
                String timeStr = record.get(request.getDateColumn());
                String valueStr = record.get(request.getValueColumn());

                try {
                    Double value = Double.parseDouble(valueStr.trim());
                    points.add(ForecastResult.DataPoint.builder()
                            .time(timeStr)
                            .value(value)
                            .build());
                } catch (NumberFormatException e) {
                    // Skip invalid values
                }
            }

        } catch (Exception e) {
            log.error("Failed to read time series data", e);
        }

        return points;
    }

    /**
     * Generate forecast using specified method
     */
    private List<ForecastResult.DataPoint> generateForecast(
            List<ForecastResult.DataPoint> history, ForecastRequest request) {
        
        if (request.getMethod() == ForecastRequest.ForecastMethod.MOVING_AVERAGE) {
            return movingAverageForecast(history, request.getHorizon());
        } else {
            return seasonalNaiveForecast(history, request.getHorizon());
        }
    }

    /**
     * Moving average forecast
     */
    private List<ForecastResult.DataPoint> movingAverageForecast(
            List<ForecastResult.DataPoint> history, int horizon) {
        
        int window = Math.min(7, history.size()); // 7-period moving average
        List<Double> values = history.stream()
                .map(ForecastResult.DataPoint::getValue)
                .collect(Collectors.toList());

        // Calculate last moving average
        double avg = values.subList(values.size() - window, values.size())
                .stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);

        // Generate forecast points
        List<ForecastResult.DataPoint> forecast = new ArrayList<>();
        for (int i = 1; i <= horizon; i++) {
            forecast.add(ForecastResult.DataPoint.builder()
                    .time("t+" + i)
                    .value(avg)
                    .build());
        }

        return forecast;
    }

    /**
     * Seasonal naive forecast
     */
    private List<ForecastResult.DataPoint> seasonalNaiveForecast(
            List<ForecastResult.DataPoint> history, int horizon) {
        
        // Use last value as naive forecast
        if (history.isEmpty()) {
            return Collections.emptyList();
        }

        double lastValue = history.get(history.size() - 1).getValue();

        List<ForecastResult.DataPoint> forecast = new ArrayList<>();
        for (int i = 1; i <= horizon; i++) {
            forecast.add(ForecastResult.DataPoint.builder()
                    .time("t+" + i)
                    .value(lastValue)
                    .build());
        }

        return forecast;
    }
}

