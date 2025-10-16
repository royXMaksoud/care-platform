package com.portal.das.web.controller;

import com.portal.das.domain.model.Dataset;
import com.portal.das.domain.ports.out.dataset.DatasetSearchPort;
import com.portal.das.web.dto.dataset.DatasetInfoResponse;
import com.portal.das.web.mapper.DatasetWebMapper;
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
 * REST Controller for paginated dataset queries
 */
@Slf4j
@RestController
@RequestMapping("/api/datasets")
@RequiredArgsConstructor
@Tag(name = "Dataset Management")
public class DatasetPaginationController {

    private final DatasetSearchPort datasetSearchPort;
    private final DatasetWebMapper datasetWebMapper;

    /**
     * Get datasets with pagination
     * GET /api/datasets?page=0&size=20&sort=createdAt,desc
     *
     * @param page Page number (0-based)
     * @param size Page size
     * @param sort Sort criteria
     * @param filter Filter criteria
     * @return Paginated datasets
     */
    @GetMapping
    @Operation(summary = "List datasets", description = "Get paginated list of datasets with filtering")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public PageResponse<DatasetInfoResponse> listDatasets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort,
            @RequestBody(required = false) FilterRequest filter) {
        
        log.info("Listing datasets: page={}, size={}", page, size);

        // Create pageable
        Pageable pageable = createPageable(page, size, sort);

        // Search datasets
        Page<Dataset> datasetsPage = datasetSearchPort.search(
                filter != null ? filter : new FilterRequest(), 
                pageable);

        // Map to responses
        Page<DatasetInfoResponse> responsePage = datasetsPage.map(datasetWebMapper::toResponse);

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
            return PageRequest.of(page, size, Sort.by("createdAt").descending());
        }

        String[] parts = sortStr.split(",");
        String property = parts[0];
        Sort.Direction direction = parts.length > 1 && "asc".equalsIgnoreCase(parts[1]) 
                ? Sort.Direction.ASC 
                : Sort.Direction.DESC;

        return PageRequest.of(page, size, Sort.by(direction, property));
    }
}

