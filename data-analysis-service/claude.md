# Data Analysis Service

## Overview
The Data Analysis Service provides analytics, reporting, and business intelligence capabilities for the Care Management System. It processes operational data to generate insights, reports, and analytics dashboards to support decision-making and system monitoring.

## Service Details
- **Port**: 6065 (or determined by config)
- **Framework**: Spring Boot 3.3.5
- **Technology Stack**: Spring Cloud 2023.0.3, PostgreSQL & H2
- **Language**: Java 17
- **Shared Library**: Uses Core Shared Library 0.0.1-SNAPSHOT

## Key Technologies & Dependencies
- **Spring Web**: RESTful API development
- **Spring Data JPA**: Database persistence and ORM
- **Spring Security 6.x**: Authentication and authorization
- **Spring Validation**: Input validation
- **Spring Actuator**: Application monitoring and metrics
- **PostgreSQL & H2**: Primary data store (H2 for development)
- **Apache POI 5.2.5**: Excel file processing and generation
- **Apache Commons CSV 1.10.0**: CSV file parsing and generation
- **Jackson**: JSON processing
- **Netflix Eureka Client**: Service discovery
- **Spring Cloud Config Client**: Centralized configuration
- **MapStruct 1.5.5.Final**: DTO/Entity mapping
- **Lombok 1.18.30**: Code generation utilities
- **SpringDoc OpenAPI (WebMVC UI 2.3.0)**: API documentation
- **Micrometer Tracing (Zipkin)**: Distributed tracing

## Core Responsibilities
1. **Data Analysis**: Analyze operational data and generate insights
2. **Report Generation**: Create reports in various formats (PDF, Excel, CSV)
3. **Analytics Dashboards**: Provide aggregated metrics and visualizations
4. **Data Export**: Export data in multiple formats
5. **Statistical Analysis**: Perform statistical calculations and aggregations
6. **Performance Metrics**: Track system and operational metrics
7. **Trend Analysis**: Identify trends over time
8. **Data Aggregation**: Aggregate data from multiple sources

## Key Configuration Files
- `pom.xml`: Maven dependencies and build configuration
- `application.yml`: Spring Boot application configuration
- `application-dev.yml`: Development environment configuration
- `application-docker.yml`: Docker environment configuration
- `application-prod.yml`: Production environment configuration

## API Endpoints
```
# Report Generation
POST /api/reports/generate - Generate custom report
GET /api/reports/{id} - Get generated report
GET /api/reports/list - List available reports
DELETE /api/reports/{id} - Delete report

# Export Functionality
GET /api/export/appointments/excel - Export appointments as Excel
GET /api/export/appointments/csv - Export appointments as CSV
GET /api/export/users/excel - Export users as Excel
GET /api/export/analytics/pdf - Export analytics as PDF

# Analytics & Insights
GET /api/analytics/dashboard - Get dashboard metrics
GET /api/analytics/appointments/summary - Appointment statistics
GET /api/analytics/users/summary - User statistics
GET /api/analytics/performance-metrics - System performance metrics

# Data Aggregation
GET /api/analytics/by-date-range - Aggregated data for date range
GET /api/analytics/by-organization - Data aggregated by organization
GET /api/analytics/by-location - Data aggregated by location
GET /api/analytics/trends - Trend analysis

# Statistical Analysis
GET /api/analytics/statistics/{resource} - Statistical summary
GET /api/analytics/comparison - Compare metrics over periods
GET /api/analytics/forecasting - Predictive analytics
```

## Important Notes
- Uses **Apache POI** for generating Excel files with complex formatting
- Uses **Apache Commons CSV** for CSV import/export operations
- Supports **multiple export formats** (Excel, CSV, PDF)
- Can aggregate data from **multiple services** via OpenFeign
- Service registers with **Eureka** for service discovery
- Uses **H2 database** for local development/testing
- Heavy use of **aggregation queries** for performance
- May implement **scheduled batch processing** for data aggregation

## Integration Points
- **Service Registry**: Registers with Eureka for discovery
- **Config Server**: Retrieves configuration from centralized config server
- **PostgreSQL Database**: Primary data store for analytics data
- **Appointment Service**: Retrieves appointment data for analysis
- **Auth Service**: Validates user authentication
- **Access Management Service**: Checks permissions for report access
- **Reference Data Service**: Retrieves organizational/location data
- **Zipkin**: Sends tracing data for distributed tracing
- **Gateway Service**: APIs accessed through API Gateway

## Database Schema
- **reports**: Stores generated report metadata
- **report_parameters**: Stores report configuration/parameters
- **analytics_cache**: Caches aggregated analytics data
- **export_jobs**: Tracks export job status and history
- **metric_snapshots**: Stores periodic metric snapshots
- **audit_log**: Tracks analytics queries and exports

## Data Models

### Report
```java
id, name, description, reportType, format, parameters,
generatedDate, generatedBy, status, filePath
```

### Analytics Metric
```java
id, metricName, metricValue, timestamp, dimension1, dimension2,
organization, location, status
```

## File Export Capabilities
- **Excel**: Multi-sheet workbooks with formatting, charts
- **CSV**: Comma-separated values for spreadsheet import
- **PDF**: Formatted reports with charts and tables
- **JSON**: API response format for programmatic access

## Development & Deployment
- **Build**: `mvn clean package`
- **Run**: `java -jar data-analysis-service-0.0.1-SNAPSHOT.jar`
- **Docker**: Dockerfile available for containerization
- **Configuration**: Managed via Spring Cloud Config Server
- **Database**: PostgreSQL for production, H2 for development

## Security Considerations
- **Authentication**: All endpoints require valid JWT token
- **Authorization**: Role-based access control for sensitive reports
- **Data Privacy**: Users can only export their own data or aggregated data
- **Audit Trail**: All report generation and exports are logged
- **Rate Limiting**: Export operations may be rate-limited to prevent abuse

## Testing
- Unit tests for statistical calculations
- Integration tests with H2 database
- Export format validation tests
- Aggregation query tests
- Performance tests for large datasets

## Performance Considerations
- **Query Optimization**: Complex aggregation queries need optimization
- **Caching**: Cache aggregated metrics for frequently accessed reports
- **Pagination**: Large result sets should be paginated
- **Materialized Views**: Consider for complex aggregations
- **Batch Processing**: Schedule heavy aggregations during off-peak hours

## Scheduled Batch Jobs
- Daily metric aggregation
- Weekly report generation
- Monthly analytics rollup
- Performance metric collection
