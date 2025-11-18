package com.care.warehouse.web.dto.reports;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

/**
 * Response DTO for category-wise value report.
 */
@Getter
@Builder
public class CategoryValueResponse {
    private UUID categoryId;
    private String categoryName;
    private String categoryPath;
    private double totalValue;
    private int itemCount;
    private List<CategoryValueResponse> children;
}

