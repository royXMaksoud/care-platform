package com.portal.das.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portal.das.domain.model.DataQualityReport;
import com.portal.das.domain.model.DataQualityRule;
import com.portal.das.service.quality.DataQualityService;
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
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * WebMvc slice test for DataQualityController
 * Tests data validation endpoints
 */
@WebMvcTest(DataQualityController.class)
@DisplayName("Data Quality Controller WebMvc Tests")
class DataQualityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DataQualityService dataQualityService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @WithMockUser(roles = "ANALYST")
    @DisplayName("Should validate dataset successfully")
    void shouldValidateDataset_Successfully() throws Exception {
        // Given
        UUID datasetId = UUID.randomUUID();
        
        List<DataQualityRule> rules = new ArrayList<>();
        DataQualityRule rule = new DataQualityRule();
        rule.setColumn("age");
        rule.setExpectedType("INTEGER");
        rule.setMin(0.0);
        rule.setMax(120.0);
        rules.add(rule);

        DataQualityReport report = DataQualityReport.builder()
                .datasetId(datasetId)
                .totalRows(100)
                .totalViolations(5)
                .ruleResults(new ArrayList<>())
                .build();

        when(dataQualityService.validate(any(), any(), any())).thenReturn(report);

        // When & Then
        mockMvc.perform(post("/api/datasets/{datasetId}/validate", datasetId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rules))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.datasetId").value(datasetId.toString()))
                .andExpect(jsonPath("$.data.totalViolations").value(5));

        verify(dataQualityService).validate(eq(datasetId), any(), any());
    }

    @Test
    @WithMockUser(roles = "ANALYST")
    @DisplayName("Should handle empty rules list")
    void shouldHandleEmptyRulesList() throws Exception {
        // Given
        UUID datasetId = UUID.randomUUID();
        List<DataQualityRule> rules = new ArrayList<>();

        DataQualityReport report = DataQualityReport.builder()
                .datasetId(datasetId)
                .totalRows(100)
                .totalViolations(0)
                .ruleResults(new ArrayList<>())
                .build();

        when(dataQualityService.validate(any(), any(), any())).thenReturn(report);

        // When & Then
        mockMvc.perform(post("/api/datasets/{datasetId}/validate", datasetId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rules))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void shouldReturn401_WhenNotAuthenticated() throws Exception {
        // Given
        UUID datasetId = UUID.randomUUID();
        List<DataQualityRule> rules = new ArrayList<>();

        // When & Then
        mockMvc.perform(post("/api/datasets/{datasetId}/validate", datasetId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rules))
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }
}

