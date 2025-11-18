package com.care.warehouse.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI/Swagger configuration for warehouse service
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI warehouseServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Warehouse Service API")
                        .description("REST API for Warehouse Management Service - Multi-tenant warehouse management with IoT and blockchain extensibility")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Care Platform Team")
                                .email("support@careplatform.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")));
    }
}

