package com.care.appointment.infrastructure.db.repositories;

import com.care.appointment.infrastructure.db.entities.OrganizationBranchEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

/**
 * Repository for accessing organization branch metadata directly from the appointment service.
 * We only need simple CRUD operations for fetching branch codes during appointment creation.
 */
public interface OrganizationBranchRepository extends JpaRepository<OrganizationBranchEntity, UUID> {
}

