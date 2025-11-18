package com.care.warehouse.domain.ports.in;

import com.care.warehouse.application.material.command.UpdateMaterialCommand;
import com.care.warehouse.domain.model.Material;
import com.sharedlib.core.domain.ports.in.UpdateUseCase;

import java.util.UUID;

/**
 * Use case interface for updating an existing material.
 */
public interface UpdateMaterialUseCase extends UpdateUseCase<UUID, UpdateMaterialCommand, Material> {
    
    /**
     * Update an existing material.
     * 
     * @param command Update material command
     * @return Updated material
     */
    default Material updateMaterial(UpdateMaterialCommand command) {
        return update(command.getId(), command);
    }
}

