package com.portal.das.service.profile;

import com.portal.das.domain.model.ChartData;
import com.portal.das.domain.model.ColumnSummary;
import com.portal.das.domain.model.Dataset;
import com.portal.das.domain.model.UploadedFile;
import com.portal.das.domain.ports.out.dataset.DatasetCrudPort;
import com.portal.das.domain.ports.out.file.FileCrudPort;
import com.portal.das.domain.ports.out.file.FileStoragePort;
import com.sharedlib.core.exception.NotFoundException;
import com.sharedlib.core.i18n.MessageResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ColumnSummaryService
 * Tests histogram generation, category counts, and summary statistics
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Column Summary Service Tests")
class ColumnSummaryServiceTest {

    @Mock
    private DatasetCrudPort datasetCrudPort;

    @Mock
    private FileCrudPort fileCrudPort;

    @Mock
    private FileStoragePort fileStoragePort;

    @Mock
    private MessageResolver messageResolver;

    private ColumnSummaryService columnSummaryService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        columnSummaryService = new ColumnSummaryService(
                datasetCrudPort,
                fileCrudPort,
                fileStoragePort
        );
    }

    @Test
    @DisplayName("Should generate histogram for numeric column")
    void shouldGenerateHistogram_ForNumericColumn() throws IOException {
        // Given
        UUID datasetId = UUID.randomUUID();
        String columnName = "price";
        
        Dataset dataset = createMockDataset(datasetId);
        UploadedFile file = createMockFile();
        
        String csvData = "price,quantity\n10.5,1\n20.3,2\n30.7,3\n15.2,4\n25.8,5";
        InputStream csvStream = new ByteArrayInputStream(csvData.getBytes());

        when(datasetCrudPort.load(datasetId)).thenReturn(Optional.of(dataset));
        when(fileCrudPort.load(dataset.getFileId())).thenReturn(Optional.of(file));
        when(fileStoragePort.retrieve(file.getStoredFilename())).thenReturn(csvStream);

        // When
        ChartData chartData = columnSummaryService.getChartData(datasetId, columnName);

        // Then
        assertThat(chartData).isNotNull();
        assertThat(chartData.getHistogram()).isNotNull();
        assertThat(chartData.getHistogram().getBins()).isNotEmpty();
        assertThat(chartData.getHistogram().getTotalBins()).isGreaterThan(0);
        
        verify(datasetCrudPort).load(datasetId);
        verify(fileCrudPort).load(dataset.getFileId());
    }

    @Test
    @DisplayName("Should generate category counts for string column")
    void shouldGenerateCategoryCounts_ForStringColumn() throws IOException {
        // Given
        UUID datasetId = UUID.randomUUID();
        String columnName = "category";
        
        Dataset dataset = createMockDataset(datasetId);
        UploadedFile file = createMockFile();
        
        String csvData = "category,value\nA,10\nB,20\nA,30\nC,40\nB,50\nA,60";
        InputStream csvStream = new ByteArrayInputStream(csvData.getBytes());

        when(datasetCrudPort.load(datasetId)).thenReturn(Optional.of(dataset));
        when(fileCrudPort.load(dataset.getFileId())).thenReturn(Optional.of(file));
        when(fileStoragePort.retrieve(file.getStoredFilename())).thenReturn(csvStream);

        // When
        ChartData chartData = columnSummaryService.getChartData(datasetId, columnName);

        // Then
        assertThat(chartData).isNotNull();
        assertThat(chartData.getCategories()).isNotNull();
        assertThat(chartData.getCategories()).isNotEmpty();
        
        // Verify category counts
        ChartData.CategoryData categoryA = chartData.getCategories().stream()
                .filter(c -> "A".equals(c.getLabel()))
                .findFirst()
                .orElse(null);
        
        assertThat(categoryA).isNotNull();
        assertThat(categoryA.getValue()).isEqualTo(3); // "A" appears 3 times
    }

    @Test
    @DisplayName("Should calculate summary statistics correctly")
    void shouldCalculateSummaryStatistics_Correctly() throws IOException {
        // Given
        UUID datasetId = UUID.randomUUID();
        String columnName = "age";
        
        Dataset dataset = createMockDataset(datasetId);
        UploadedFile file = createMockFile();
        
        // Data: 10, 20, 30, 40, 50 (mean=30, min=10, max=50)
        String csvData = "age,name\n10,John\n20,Jane\n30,Bob\n40,Alice\n50,Charlie";
        InputStream csvStream = new ByteArrayInputStream(csvData.getBytes());

        when(datasetCrudPort.load(datasetId)).thenReturn(Optional.of(dataset));
        when(fileCrudPort.load(dataset.getFileId())).thenReturn(Optional.of(file));
        when(fileStoragePort.retrieve(file.getStoredFilename())).thenReturn(csvStream);

        // When
        ColumnSummary summary = columnSummaryService.getSummary(datasetId, columnName);

        // Then
        assertThat(summary).isNotNull();
        assertThat(summary.getCount()).isEqualTo(5);
        assertThat(summary.getNulls()).isEqualTo(0);
        assertThat(summary.getNonNulls()).isEqualTo(5);
        assertThat(summary.getMin()).isEqualTo(10.0);
        assertThat(summary.getMax()).isEqualTo(50.0);
        assertThat(summary.getMean()).isEqualTo(30.0);
    }

    @Test
    @DisplayName("Should handle null and empty values")
    void shouldHandleNullAndEmptyValues() throws IOException {
        // Given
        UUID datasetId = UUID.randomUUID();
        String columnName = "score";
        
        Dataset dataset = createMockDataset(datasetId);
        UploadedFile file = createMockFile();
        
        String csvData = "score,name\n100,John\n,Jane\n90,Bob\n\"\",Alice\n80,Charlie";
        InputStream csvStream = new ByteArrayInputStream(csvData.getBytes());

        when(datasetCrudPort.load(datasetId)).thenReturn(Optional.of(dataset));
        when(fileCrudPort.load(dataset.getFileId())).thenReturn(Optional.of(file));
        when(fileStoragePort.retrieve(file.getStoredFilename())).thenReturn(csvStream);

        // When
        ColumnSummary summary = columnSummaryService.getSummary(datasetId, columnName);

        // Then
        assertThat(summary).isNotNull();
        assertThat(summary.getCount()).isEqualTo(5);
        assertThat(summary.getNulls()).isEqualTo(2); // Two empty/null values
        assertThat(summary.getNonNulls()).isEqualTo(3); // Three valid values
    }

    @Test
    @DisplayName("Should throw NotFoundException when dataset not found")
    void shouldThrowNotFoundException_WhenDatasetNotFound() {
        // Given
        UUID datasetId = UUID.randomUUID();
        String columnName = "test";
        
        when(datasetCrudPort.load(datasetId)).thenReturn(Optional.empty());
        when(messageResolver.getMessage(any(), any())).thenReturn("Dataset not found");

        // When & Then
        assertThatThrownBy(() -> columnSummaryService.getSummary(datasetId, columnName))
                .isInstanceOf(NotFoundException.class);
        
        verify(datasetCrudPort).load(datasetId);
    }

    @Test
    @DisplayName("Should calculate histogram bins correctly")
    void shouldCalculateHistogramBins_Correctly() throws IOException {
        // Given
        UUID datasetId = UUID.randomUUID();
        String columnName = "value";
        
        Dataset dataset = createMockDataset(datasetId);
        UploadedFile file = createMockFile();
        
        // Values: 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
        String csvData = "value\n0\n10\n20\n30\n40\n50\n60\n70\n80\n90\n100";
        InputStream csvStream = new ByteArrayInputStream(csvData.getBytes());

        when(datasetCrudPort.load(datasetId)).thenReturn(Optional.of(dataset));
        when(fileCrudPort.load(dataset.getFileId())).thenReturn(Optional.of(file));
        when(fileStoragePort.retrieve(file.getStoredFilename())).thenReturn(csvStream);

        // When
        ChartData chartData = columnSummaryService.getChartData(datasetId, columnName);

        // Then
        assertThat(chartData.getHistogram()).isNotNull();
        
        List<ChartData.HistogramData.Bin> bins = chartData.getHistogram().getBins();
        assertThat(bins).isNotEmpty();
        
        // Verify bin structure
        for (ChartData.HistogramData.Bin bin : bins) {
            assertThat(bin.getBinStart()).isLessThanOrEqualTo(bin.getBinEnd());
            assertThat(bin.getFrequency()).isGreaterThanOrEqualTo(0);
        }
        
        // Verify total frequency equals data count
        long totalFrequency = bins.stream()
                .mapToLong(ChartData.HistogramData.Bin::getFrequency)
                .sum();
        assertThat(totalFrequency).isEqualTo(11); // 11 data points
    }

    @Test
    @DisplayName("Should limit category results to top 20")
    void shouldLimitCategoryResults_ToTop20() throws IOException {
        // Given
        UUID datasetId = UUID.randomUUID();
        String columnName = "item";
        
        Dataset dataset = createMockDataset(datasetId);
        UploadedFile file = createMockFile();
        
        // Create CSV with 30 different categories
        StringBuilder csvBuilder = new StringBuilder("item,count\n");
        for (int i = 1; i <= 30; i++) {
            // Higher numbers appear more frequently
            int frequency = 31 - i;
            for (int j = 0; j < frequency; j++) {
                csvBuilder.append("Item").append(i).append(",").append(j).append("\n");
            }
        }
        
        InputStream csvStream = new ByteArrayInputStream(csvBuilder.toString().getBytes());

        when(datasetCrudPort.load(datasetId)).thenReturn(Optional.of(dataset));
        when(fileCrudPort.load(dataset.getFileId())).thenReturn(Optional.of(file));
        when(fileStoragePort.retrieve(file.getStoredFilename())).thenReturn(csvStream);

        // When
        ChartData chartData = columnSummaryService.getChartData(datasetId, columnName);

        // Then
        assertThat(chartData.getCategories()).isNotNull();
        assertThat(chartData.getCategories()).hasSizeLessThanOrEqualTo(20);
        
        // Verify categories are sorted by frequency (descending)
        List<ChartData.CategoryData> categories = chartData.getCategories();
        for (int i = 0; i < categories.size() - 1; i++) {
            assertThat(categories.get(i).getValue())
                    .isGreaterThanOrEqualTo(categories.get(i + 1).getValue());
        }
    }

    // Helper methods
    private Dataset createMockDataset(UUID datasetId) {
        return Dataset.builder()
                .datasetId(datasetId)
                .fileId(UUID.randomUUID())
                .name("Test Dataset")
                .rowCount(100)
                .columnCount(5)
                .build();
    }

    private UploadedFile createMockFile() {
        return UploadedFile.builder()
                .fileId(UUID.randomUUID())
                .storedFilename("test.csv")
                .storagePath("storage/test.csv")
                .status(UploadedFile.FileStatus.PROCESSED)
                .build();
    }
}

