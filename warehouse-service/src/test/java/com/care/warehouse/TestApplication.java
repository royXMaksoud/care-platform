package com.care.warehouse;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Test-specific Spring Boot application that only scans web package,
 * excluding application services and infrastructure to avoid JPA dependencies.
 */
@SpringBootApplication(exclude = {
        DataSourceAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class,
        JpaRepositoriesAutoConfiguration.class,
        FlywayAutoConfiguration.class
})
@ComponentScan(
        basePackages = {"com.care.warehouse.web", "com.care.warehouse.domain", "com.care.warehouse.application", "com.sharedlib.core"},
        excludeFilters = {
                // Exclude only service implementations, validators, and mappers (they need JPA)
                @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.care\\.warehouse\\.application\\..*\\.service\\..*"),
                @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.care\\.warehouse\\.application\\..*\\.validation\\..*"),
                @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.care\\.warehouse\\.application\\..*\\.mapper\\..*"),
                @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.care\\.warehouse\\.application\\.common\\.filter\\..*"),
                @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.care\\.warehouse\\.infrastructure\\..*"),
                @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.care\\.warehouse\\.config\\..*"),
                @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.care\\.warehouse\\.WarehouseServiceApplication"),
                // Exclude sharedlib GlobalExceptionHandler to avoid conflict with warehouse-service's handler
                @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.sharedlib\\.core\\.exception\\.GlobalExceptionHandler"),
                // Exclude ActionPermissionAspect (needs PermissionChecker from sharedlib)
                @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.care\\.warehouse\\.application\\.common\\.permissions\\.ActionPermissionAspect"),
                // Exclude all controllers except WarehouseController (for WarehouseControllerTest)
                @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.care\\.warehouse\\.web\\.controller\\.BrandController"),
                @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.care\\.warehouse\\.web\\.controller\\.CategoryController"),
                @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.care\\.warehouse\\.web\\.controller\\.MaterialController"),
                @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.care\\.warehouse\\.web\\.controller\\.StockController"),
                @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.care\\.warehouse\\.web\\.controller\\.CustomFieldDefinitionController"),
                @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.care\\.warehouse\\.web\\.controller\\.OrderController"),
                @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.care\\.warehouse\\.web\\.controller\\.ReportsController"),
                @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.care\\.warehouse\\.web\\.controller\\.WarehouseMaterialStockController"),
                @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.care\\.warehouse\\.web\\.controller\\.HealthController")
        }
)
@EnableWebSecurity
public class TestApplication {
    
    /**
     * Mock SecurityConfig for tests - disable security in tests
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}

