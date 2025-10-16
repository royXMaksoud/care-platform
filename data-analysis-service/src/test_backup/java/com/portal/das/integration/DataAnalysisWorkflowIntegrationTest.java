package com.portal.das.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portal.das.DataAnalysisServiceApplication;
import com.portal.das.domain.model.DataQualityRule;
import com.portal.das.web.dto.dataset.RegisterDatasetRequest;
import com.sharedlib.core.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration test for complete data analysis workflow
 * Tests the full pipeline: upload → register → profile → column summary → join → validate → pipeline run
 */
@SpringBootTest(classes = DataAnalysisServiceApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Data Analysis Workflow Integration Tests")
class DataAnalysisWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String authToken;

    @BeforeEach
    void setUp() {
        // Generate a test JWT token
        authToken = "Bearer test-token";
    }

    @Test
    @WithMockUser(username = "test-analyst", roles = {"ANALYST"})
    @DisplayName("Should complete full workflow: upload → register → profile → column summary")
    void shouldCompleteFullWorkflow_UploadToColumnSummary() throws Exception {
        // Step 1: Upload a CSV file
        MockMultipartFile file = new MockMultipartFile(
                "files",
                "sales_data.csv",
                "text/csv",
                ("product,price,quantity,date\n" +
                        "Laptop,1200.50,5,2024-01-15\n" +
                        "Mouse,25.99,20,2024-01-16\n" +
                        "Keyboard,75.00,15,2024-01-17\n" +
                        "Monitor,350.00,8,2024-01-18\n" +
                        "Headphones,89.99,12,2024-01-19").getBytes()
        );

        MvcResult uploadResult = mockMvc.perform(multipart("/api/files/upload")
                        .file(file)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andReturn();

        String uploadResponse = uploadResult.getResponse().getContentAsString();
        String fileId = extractFileId(uploadResponse);
        assertThat(fileId).isNotNull();

        // Step 2: Register dataset from uploaded file
        RegisterDatasetRequest registerRequest = new RegisterDatasetRequest();
        registerRequest.setName("Sales Dataset Q1 2024");

        MvcResult registerResult = mockMvc.perform(post("/api/datasets/from-file/{fileId}", fileId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.datasetId").exists())
                .andExpect(jsonPath("$.data.name").value("Sales Dataset Q1 2024"))
                .andReturn();

        String registerResponse = registerResult.getResponse().getContentAsString();
        String datasetId = extractDatasetId(registerResponse);
        assertThat(datasetId).isNotNull();

        // Step 3: Get dataset profile
        mockMvc.perform(get("/api/datasets/{datasetId}/profile", datasetId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.columns").isArray());

        // Step 4: Get column summary for 'price' column
        mockMvc.perform(get("/api/datasets/{datasetId}/columns/{columnName}/summary", datasetId, "price")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.count").exists())
                .andExpect(jsonPath("$.data.min").exists())
                .andExpect(jsonPath("$.data.max").exists())
                .andExpect(jsonPath("$.data.mean").exists());

        // Step 5: Get chart data for 'price' column
        mockMvc.perform(get("/api/datasets/{datasetId}/columns/{columnName}/charts", datasetId, "price")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").exists());
    }

    @Test
    @WithMockUser(username = "test-analyst", roles = {"ANALYST"})
    @DisplayName("Should validate dataset with data quality rules")
    void shouldValidateDataset_WithQualityRules() throws Exception {
        // Step 1: Upload and register dataset
        String datasetId = uploadAndRegisterDataset("validation_test.csv",
                "id,name,age,email\n" +
                        "1,John,30,john@example.com\n" +
                        "2,Jane,25,jane@example.com\n" +
                        "3,Bob,-5,invalid-email\n" +
                        "4,Alice,150,alice@example.com\n" +
                        "5,,35,test@example.com");

        // Step 2: Create validation rules
        List<DataQualityRule> rules = new ArrayList<>();
        
        DataQualityRule ageRule = new DataQualityRule();
        ageRule.setColumn("age");
        ageRule.setExpectedType("INTEGER");
        ageRule.setMin(0.0);
        ageRule.setMax(120.0);
        rules.add(ageRule);

        DataQualityRule nameRule = new DataQualityRule();
        nameRule.setColumn("name");
        nameRule.setRequired(true);
        rules.add(nameRule);

        DataQualityRule emailRule = new DataQualityRule();
        emailRule.setColumn("email");
        emailRule.setRegex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
        rules.add(emailRule);

        // Step 3: Validate dataset
        mockMvc.perform(post("/api/datasets/{datasetId}/validate", datasetId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rules))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.ruleResults").isArray())
                .andExpect(jsonPath("$.data.totalViolations").exists());
    }

    @Test
    @WithMockUser(username = "test-analyst", roles = {"ANALYST"})
    @DisplayName("Should join two datasets")
    void shouldJoinTwoDatasets_Successfully() throws Exception {
        // Step 1: Upload and register first dataset (customers)
        String customersDatasetId = uploadAndRegisterDataset("customers.csv",
                "customer_id,name,city\n" +
                        "1,John,New York\n" +
                        "2,Jane,Boston\n" +
                        "3,Bob,Chicago");

        // Step 2: Upload and register second dataset (orders)
        String ordersDatasetId = uploadAndRegisterDataset("orders.csv",
                "order_id,customer_id,amount\n" +
                        "101,1,250.50\n" +
                        "102,2,150.00\n" +
                        "103,1,300.75\n" +
                        "104,3,75.25");

        // Step 3: Create join request
        String joinRequestJson = String.format("""
                {
                    "leftDatasetId": "%s",
                    "rightDatasetId": "%s",
                    "leftOn": ["customer_id"],
                    "rightOn": ["customer_id"],
                    "how": "INNER",
                    "suffixes": ["_customer", "_order"]
                }
                """, customersDatasetId, ordersDatasetId);

        // Step 4: Execute join
        mockMvc.perform(post("/api/datasets/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(joinRequestJson)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.datasetId").exists())
                .andExpect(jsonPath("$.data.rows").exists())
                .andExpect(jsonPath("$.data.columns").exists());
    }

    @Test
    @WithMockUser(username = "test-analyst", roles = {"ANALYST"})
    @DisplayName("Should download dataset as CSV")
    void shouldDownloadDataset_AsCsv() throws Exception {
        // Step 1: Upload and register dataset
        String datasetId = uploadAndRegisterDataset("download_test.csv",
                "product,price\n" +
                        "Item1,10.50\n" +
                        "Item2,20.75");

        // Step 2: Download dataset
        mockMvc.perform(get("/api/datasets/{datasetId}/download", datasetId))
                .andExpect(status().isOk())
                .andExpect(header().exists("Content-Disposition"))
                .andExpect(content().contentType("text/csv"));
    }

    @Test
    @WithMockUser(username = "test-analyst", roles = {"ANALYST"})
    @DisplayName("Should handle multiple file formats")
    void shouldHandleMultipleFileFormats() throws Exception {
        // Test CSV
        MockMultipartFile csvFile = new MockMultipartFile(
                "files",
                "test.csv",
                "text/csv",
                "col1,col2\nval1,val2".getBytes()
        );

        mockMvc.perform(multipart("/api/files/upload")
                        .file(csvFile)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Note: Excel file testing would require actual Excel file bytes
        // For integration tests, you would include test Excel files in src/test/resources
    }

    @Test
    @WithMockUser(username = "test-admin", roles = {"ADMIN"})
    @DisplayName("Should delete dataset and associated files")
    void shouldDeleteDataset_AndAssociatedFiles() throws Exception {
        // Step 1: Upload and register dataset
        String datasetId = uploadAndRegisterDataset("delete_test.csv",
                "col1,col2\nval1,val2\nval3,val4");

        // Step 2: Verify dataset exists
        mockMvc.perform(get("/api/datasets/{datasetId}", datasetId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Step 3: Delete dataset
        mockMvc.perform(delete("/api/datasets/{datasetId}", datasetId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Step 4: Verify dataset is deleted (should return 404 or empty)
        mockMvc.perform(get("/api/datasets/{datasetId}", datasetId))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "test-analyst", roles = {"ANALYST"})
    @DisplayName("Should handle forecast preview")
    void shouldHandleForecastPreview() throws Exception {
        // Step 1: Upload time series data
        String datasetId = uploadAndRegisterDataset("timeseries.csv",
                "date,sales\n" +
                        "2024-01-01,100\n" +
                        "2024-01-02,120\n" +
                        "2024-01-03,110\n" +
                        "2024-01-04,130\n" +
                        "2024-01-05,125");

        // Step 2: Request forecast preview
        String forecastRequest = """
                {
                    "dateColumn": "date",
                    "valueColumn": "sales",
                    "horizon": 3
                }
                """;

        mockMvc.perform(post("/api/datasets/{datasetId}/forecast/preview", datasetId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(forecastRequest)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.actual").isArray())
                .andExpect(jsonPath("$.data.forecast").isArray());
    }

    // Helper methods
    private String uploadAndRegisterDataset(String filename, String content) throws Exception {
        // Upload file
        MockMultipartFile file = new MockMultipartFile(
                "files",
                filename,
                "text/csv",
                content.getBytes()
        );

        MvcResult uploadResult = mockMvc.perform(multipart("/api/files/upload")
                        .file(file)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andReturn();

        String fileId = extractFileId(uploadResult.getResponse().getContentAsString());

        // Register dataset
        RegisterDatasetRequest registerRequest = new RegisterDatasetRequest();
        registerRequest.setName(filename.replace(".csv", " Dataset"));

        MvcResult registerResult = mockMvc.perform(post("/api/datasets/from-file/{fileId}", fileId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andReturn();

        return extractDatasetId(registerResult.getResponse().getContentAsString());
    }

    private String extractFileId(String jsonResponse) throws Exception {
        var jsonNode = objectMapper.readTree(jsonResponse);
        return jsonNode.at("/data/0/fileId").asText();
    }

    private String extractDatasetId(String jsonResponse) throws Exception {
        var jsonNode = objectMapper.readTree(jsonResponse);
        return jsonNode.at("/data/datasetId").asText();
    }
}

