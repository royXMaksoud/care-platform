package com.portal.das.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portal.das.application.file.service.FileServiceImpl;
import com.portal.das.domain.model.UploadedFile;
import com.portal.das.web.dto.file.FileInfoResponse;
import com.portal.das.web.dto.file.FileUploadResponse;
import com.portal.das.web.mapper.FileWebMapper;
import com.sharedlib.core.security.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * WebMvc slice test for FileController
 * Tests HTTP layer without full application context
 */
@WebMvcTest(FileController.class)
@DisplayName("File Controller WebMvc Tests")
class FileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FileServiceImpl fileService;

    @MockBean
    private FileWebMapper fileWebMapper;

    @MockBean
    private JwtTokenProvider jwtTokenProvider; // Required for security

    @Test
    @WithMockUser(roles = "ANALYST")
    @DisplayName("Should upload files successfully")
    void shouldUploadFiles_Successfully() throws Exception {
        // Given
        MockMultipartFile file1 = new MockMultipartFile(
                "files",
                "test1.csv",
                "text/csv",
                "header1,header2\nvalue1,value2".getBytes()
        );

        MockMultipartFile file2 = new MockMultipartFile(
                "files",
                "test2.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "mock excel content".getBytes()
        );

        UUID fileId1 = UUID.randomUUID();
        UUID fileId2 = UUID.randomUUID();

        UploadedFile uploadedFile1 = createMockUploadedFile(fileId1, "test1.csv");
        UploadedFile uploadedFile2 = createMockUploadedFile(fileId2, "test2.xlsx");

        FileUploadResponse response1 = FileUploadResponse.builder()
                .fileId(fileId1)
                .originalFilename("test1.csv")
                .status("PROCESSED")
                .build();
        FileUploadResponse response2 = FileUploadResponse.builder()
                .fileId(fileId2)
                .originalFilename("test2.xlsx")
                .status("PROCESSED")
                .build();

        when(fileService.uploadFiles(any())).thenReturn(List.of(uploadedFile1, uploadedFile2));
        when(fileWebMapper.toUploadResponse(uploadedFile1)).thenReturn(response1);
        when(fileWebMapper.toUploadResponse(uploadedFile2)).thenReturn(response2);

        // When & Then
        mockMvc.perform(multipart("/api/files/upload")
                        .file(file1)
                        .file(file2)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(2));

        verify(fileService).uploadFiles(any());
    }

    @Test
    @WithMockUser(roles = "ANALYST")
    @DisplayName("Should get file by ID")
    void shouldGetFileById_Successfully() throws Exception {
        // Given
        UUID fileId = UUID.randomUUID();
        UploadedFile uploadedFile = createMockUploadedFile(fileId, "test.csv");
        FileInfoResponse response = FileInfoResponse.builder()
                .fileId(fileId)
                .originalFilename("test.csv")
                .storedFilename(fileId + ".csv")
                .originalFormat("csv")
                .storedFormat("csv")
                .rowCount(10)
                .columnCount(3)
                .status("PROCESSED")
                .build();

        when(fileService.getById(fileId)).thenReturn(uploadedFile);
        when(fileWebMapper.toInfoResponse(uploadedFile)).thenReturn(response);

        // When & Then
        mockMvc.perform(get("/api/files/{fileId}", fileId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fileId").value(fileId.toString()))
                .andExpect(jsonPath("$.data.originalFilename").value("test.csv"));

        verify(fileService).getById(fileId);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("Should delete file successfully")
    void shouldDeleteFile_Successfully() throws Exception {
        // Given
        UUID fileId = UUID.randomUUID();
        doNothing().when(fileService).delete(fileId);

        // When & Then
        mockMvc.perform(delete("/api/files/{fileId}", fileId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(fileService).delete(fileId);
    }

    @Test
    @DisplayName("Should return 401 when not authenticated")
    void shouldReturn401_WhenNotAuthenticated() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/files/{fileId}", UUID.randomUUID()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ANALYST")
    @DisplayName("Should return 400 when no files provided")
    void shouldReturn400_WhenNoFilesProvided() throws Exception {
        // When & Then
        mockMvc.perform(multipart("/api/files/upload")
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    // Helper method
    private UploadedFile createMockUploadedFile(UUID fileId, String filename) {
        return UploadedFile.builder()
                .fileId(fileId)
                .originalFilename(filename)
                .storedFilename(fileId + ".csv")
                .originalFormat(getExtension(filename))
                .storedFormat("csv")
                .rowCount(10)
                .columnCount(3)
                .status(UploadedFile.FileStatus.PROCESSED)
                .uploadedAt(Instant.now())
                .build();
    }

    private String getExtension(String filename) {
        return filename.substring(filename.lastIndexOf(".") + 1);
    }
}

