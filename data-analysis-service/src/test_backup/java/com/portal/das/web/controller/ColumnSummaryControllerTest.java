package com.portal.das.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portal.das.domain.model.ChartData;
import com.portal.das.domain.model.ColumnSummary;
import com.portal.das.service.profile.ColumnSummaryService;
import com.sharedlib.core.security.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * WebMvc slice test for ColumnSummaryController
 * Tests column summary and chart endpoints
 */
@WebMvcTest(ColumnController.class)
@DisplayName("Column Controller WebMvc Tests")
class ColumnSummaryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ColumnSummaryService columnSummaryService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @WithMockUser(roles = "ANALYST")
    @DisplayName("Should get column summary successfully")
    void shouldGetColumnSummary_Successfully() throws Exception {
        // Given
        UUID datasetId = UUID.randomUUID();
        String columnName = "price";
        
        ColumnSummary summary = ColumnSummary.builder()
                .columnName(columnName)
                .count(100)
                .nulls(5)
                .nonNulls(95)
                .uniques(80)
                .min(10.0)
                .max(1000.0)
                .mean(250.5)
                .std(150.3)
                .build();

        when(columnSummaryService.getSummary(any(), any())).thenReturn(summary);

        // When & Then
        mockMvc.perform(get("/api/datasets/{datasetId}/columns/{columnName}/summary", datasetId, columnName)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.columnName").value(columnName))
                .andExpect(jsonPath("$.data.count").value(100))
                .andExpect(jsonPath("$.data.mean").value(250.5));

        verify(columnSummaryService).getSummary(datasetId, columnName);
    }

    @Test
    @WithMockUser(roles = "ANALYST")
    @DisplayName("Should get chart data successfully")
    void shouldGetChartData_Successfully() throws Exception {
        // Given
        UUID datasetId = UUID.randomUUID();
        String columnName = "category";
        
        List<ChartData.CategoryData> categories = new ArrayList<>();
        categories.add(new ChartData.CategoryData("Category A", 50));
        categories.add(new ChartData.CategoryData("Category B", 30));
        categories.add(new ChartData.CategoryData("Category C", 20));
        
        ChartData chartData = ChartData.builder()
                .categories(categories)
                .build();

        when(columnSummaryService.getChartData(any(), any())).thenReturn(chartData);

        // When & Then
        mockMvc.perform(get("/api/datasets/{datasetId}/columns/{columnName}/charts", datasetId, columnName)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.categories").isArray())
                .andExpect(jsonPath("$.data.categories.length()").value(3));

        verify(columnSummaryService).getChartData(datasetId, columnName);
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void shouldReturn401_WhenNotAuthenticated() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/datasets/{datasetId}/columns/{columnName}/summary", 
                        UUID.randomUUID(), "test"))
                .andExpect(status().isUnauthorized());
    }
}

