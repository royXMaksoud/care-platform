package com.sharedlib.core.filter;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FilterRequest {

    private List<SearchCriteria> criteria;

    private List<FilterGroup> groups;

    private List<ScopeCriteria> scopes;

    public void setCriteria(List<SearchCriteria> criteria) {
        this.criteria = criteria;
    }

    public void setGroups(List<FilterGroup> groups) {
        this.groups = groups;
    }

    public void setScopes(List<ScopeCriteria> scopes) {
        this.scopes = scopes;
    }
}

