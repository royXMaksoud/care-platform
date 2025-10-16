package com.portal.das.web.controller;

import com.portal.das.domain.model.UploadedFile;
import com.portal.das.domain.ports.out.file.FileSearchPort;
import com.portal.das.web.dto.file.FileInfoResponse;
import com.portal.das.web.mapper.FileWebMapper;
import com.sharedlib.core.filter.FilterRequest;
import com.sharedlib.core.web.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for paginated file queries
 */
@Slf4j
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "File Management")
public class FilePaginationController {

    private final FileSearchPort fileSearchPort;
    private final FileWebMapper fileWebMapper;

    /**
     * Get files with pagination
     * GET /api/files?page=0&size=20
     *
     * @param page Page number
     * @param size Page size
     * @param sort Sort criteria
     * @param filter Filter criteria
     * @return Paginated files
     */
    @GetMapping
    @Operation(summary = "List files", description = "Get paginated list of uploaded files")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public PageResponse<FileInfoResponse> listFiles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort,
            @RequestBody(required = false) FilterRequest filter) {
        
        log.info("Listing files: page={}, size={}", page, size);

        Pageable pageable = createPageable(page, size, sort);

        Page<UploadedFile> filesPage = fileSearchPort.search(
                filter != null ? filter : new FilterRequest(), 
                pageable);

        Page<FileInfoResponse> responsePage = filesPage.map(fileWebMapper::toInfoResponse);

        return new PageResponse<>(
                responsePage.getContent(),
                page,
                size,
                responsePage.getTotalElements(),
                responsePage.getTotalPages()
        );
    }

    private Pageable createPageable(int page, int size, String sortStr) {
        if (sortStr == null || sortStr.isBlank()) {
            return PageRequest.of(page, size, Sort.by("uploadedAt").descending());
        }

        String[] parts = sortStr.split(",");
        String property = parts[0];
        Sort.Direction direction = parts.length > 1 && "asc".equalsIgnoreCase(parts[1]) 
                ? Sort.Direction.ASC 
                : Sort.Direction.DESC;

        return PageRequest.of(page, size, Sort.by(direction, property));
    }
}

