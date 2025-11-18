package com.care.warehouse.domain.ports.in;

import com.care.warehouse.application.material.command.CreateMaterialCommand;
import com.care.warehouse.domain.model.Material;
import com.sharedlib.core.domain.ports.in.CreateUseCase;

/**
 * Use case interface for creating a new material.
 */
public interface CreateMaterialUseCase extends CreateUseCase<CreateMaterialCommand, Material> {
    
    /**
     * Create a new material.
     * 
     * @param command Create material command
     * @return Created material
     */
    default Material createMaterial(CreateMaterialCommand command) {
        return create(command);
    }
}

