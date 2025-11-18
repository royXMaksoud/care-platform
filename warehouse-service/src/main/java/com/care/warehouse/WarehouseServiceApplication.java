package com.care.warehouse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FullyQualifiedAnnotationBeanNameGenerator;

/**
 * Main application class for Warehouse Service
 * 
 * This service manages multi-warehouse operations with support for:
 * - Multi-tenant architecture
 * - Warehouse hierarchy (parent/child relationships)
 * - GPS coordinates and address management
 * - Multilingual support
 * - Custom fields per tenant
 * - Future IoT and blockchain integrations
 */
@SpringBootApplication
@EnableFeignClients(basePackages = {
        "com.care.warehouse.infrastructure.client"
})
@ComponentScan(
        basePackages = { "com.care.warehouse", "com.sharedlib.core" },
        nameGenerator = FullyQualifiedAnnotationBeanNameGenerator.class
)
public class WarehouseServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(WarehouseServiceApplication.class, args);
    }
}

