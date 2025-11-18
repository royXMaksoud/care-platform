package com.care.warehouse.infrastructure.db.repository;

import com.care.warehouse.infrastructure.db.entity.BinEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BinJpaRepository extends JpaRepository<BinEntity, UUID> {
    
    /**
     * Find bin by zone and code
     */
    @Query("SELECT b FROM BinEntity b WHERE b.zoneId = :zoneId AND b.code = :code AND b.isDeleted = false")
    Optional<BinEntity> findByZoneIdAndCode(@Param("zoneId") UUID zoneId, @Param("code") String code);
    
    /**
     * Find all bins in a zone
     */
    @Query("SELECT b FROM BinEntity b WHERE b.zoneId = :zoneId AND b.isDeleted = false ORDER BY b.code ASC")
    Page<BinEntity> findByZoneId(@Param("zoneId") UUID zoneId, Pageable pageable);
    
    /**
     * Find available bins in a zone
     */
    @Query("SELECT b FROM BinEntity b WHERE b.zoneId = :zoneId AND b.status = 'AVAILABLE' AND b.isDeleted = false")
    Page<BinEntity> findAvailableByZoneId(@Param("zoneId") UUID zoneId, Pageable pageable);
    
    /**
     * Find bins by type
     */
    @Query("SELECT b FROM BinEntity b WHERE b.zoneId = :zoneId AND b.binType = :binType AND b.isDeleted = false")
    Page<BinEntity> findByZoneIdAndBinType(@Param("zoneId") UUID zoneId, @Param("binType") String binType, Pageable pageable);
    
    /**
     * Find bin by barcode
     */
    @Query("SELECT b FROM BinEntity b WHERE b.barcode = :barcode AND b.tenantId = :tenantId AND b.isDeleted = false")
    Optional<BinEntity> findByBarcodeAndTenantId(@Param("barcode") String barcode, @Param("tenantId") UUID tenantId);
    
    /**
     * Find bin by ID and tenant
     */
    @Query("SELECT b FROM BinEntity b WHERE b.id = :id AND b.tenantId = :tenantId AND b.isDeleted = false")
    Optional<BinEntity> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);
    
    /**
     * Find bins by location
     */
    @Query("SELECT b FROM BinEntity b WHERE b.zoneId = :zoneId AND b.aisleNumber = :aisleNumber AND b.shelfNumber = :shelfNumber AND b.levelNumber = :levelNumber AND b.isDeleted = false")
    Optional<BinEntity> findByLocation(@Param("zoneId") UUID zoneId, @Param("aisleNumber") Integer aisleNumber, @Param("shelfNumber") Integer shelfNumber, @Param("levelNumber") Integer levelNumber);
}
