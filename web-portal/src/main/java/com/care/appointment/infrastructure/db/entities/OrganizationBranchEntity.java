package com.care.appointment.infrastructure.db.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Lightweight representation of organization branches required by the appointment service.
 * Mirrors the access-management definition so we can reference branch metadata (code, name, etc.)
 * when generating appointment codes.
 */
@Entity
@Table(
    name = "organization_branches",
    indexes = {
        @Index(name = "ux_appt_org_branches_code", columnList = "code", unique = true),
        @Index(name = "ix_appt_org_branches_org", columnList = "organization_id"),
        @Index(name = "ix_appt_org_branches_country", columnList = "country_id"),
        @Index(name = "ix_appt_org_branches_location", columnList = "location_id")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationBranchEntity {

    @Id
    @Column(name = "organization_branch_id", nullable = false, updatable = false)
    private UUID organizationBranchId;

    @Column(name = "code", nullable = false, unique = true, length = 100)
    private String code;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "country_id", nullable = false)
    private UUID countryId;

    @Column(name = "location_id", nullable = false)
    private UUID locationId;

    @Column(name = "branch_type_id")
    private UUID branchTypeId;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "is_headquarter")
    private Boolean isHeadquarter;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted;

    @Column(name = "created_by_user_id")
    private UUID createdById;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @Column(name = "updated_by_user_id")
    private UUID updatedById;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Version
    @Column(name = "row_version")
    private Long rowVersion;

    @PrePersist
    void prePersist() {
        if (isHeadquarter == null) {
            isHeadquarter = Boolean.FALSE;
        }
        if (isActive == null) {
            isActive = Boolean.TRUE;
        }
        if (isDeleted == null) {
            isDeleted = Boolean.FALSE;
        }
    }
}

