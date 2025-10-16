package com.portal.das.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Join request model (pandas merge style)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JoinRequest {
    private UUID leftDatasetId;
    private UUID rightDatasetId;
    private List<String> leftOn;
    private List<String> rightOn;
    
    @Builder.Default
    private JoinType how = JoinType.INNER;
    
    @Builder.Default
    private List<String> suffixes = List.of("_x", "_y");
    
    private List<String> selectColumns;

    public enum JoinType {
        INNER,
        LEFT,
        RIGHT,
        FULL
    }
}

