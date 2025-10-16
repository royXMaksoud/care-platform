package com.portal.das;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.ComponentScan;

/**
 * Main application class for Data Analysis Service
 * Registers with Eureka Service Registry
 */
@SpringBootApplication
@EnableDiscoveryClient
@ComponentScan(basePackages = {"com.portal.das", "com.sharedlib.core"})
public class DataAnalysisServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(DataAnalysisServiceApplication.class, args);
    }

}

