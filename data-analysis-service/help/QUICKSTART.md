# Quick Start Guide

## Prerequisites

1. **Java 17** or higher
2. **Maven 3.6+** (or use the included Maven wrapper)
3. **PostgreSQL 12+** database

## Step 1: Create Database

Create a PostgreSQL database named `das`:

```sql
CREATE DATABASE das;
```

Or using psql command line:

```bash
psql -U postgres -c "CREATE DATABASE das;"
```

## Step 2: Set Environment Variables (Optional)

If your database settings differ from the defaults, set these environment variables:

```bash
# Windows PowerShell
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
$env:DB_NAME="das"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="your_password"

# Windows CMD
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=das
set DB_USERNAME=postgres
set DB_PASSWORD=your_password

# Linux/Mac
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=das
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
```

## Step 3: Run the Application

### Using Maven Wrapper (Recommended)

```bash
# Windows
.\mvnw.cmd spring-boot:run

# Linux/Mac
./mvnw spring-boot:run
```

### Using Installed Maven

```bash
mvn spring-boot:run
```

## Step 4: Verify the Application

Once the application starts successfully, verify it's running:

### Check Health Endpoint

```bash
curl http://localhost:6072/actuator/health
```

Expected response:
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": {
      "status": "UP"
    },
    "ping": {
      "status": "UP"
    }
  }
}
```

### Access Root Endpoint

```bash
curl http://localhost:6072/
```

Expected response:
```json
{
  "service": "data-analysis-service",
  "status": "UP",
  "message": "Data Analysis Service is running"
}
```

### Access Swagger UI

Open your browser and navigate to:
```
http://localhost:6072/swagger-ui.html
```

## Troubleshooting

### Connection Refused Error

If you get a connection refused error, ensure:
1. PostgreSQL is running
2. The database `das` exists
3. The credentials are correct
4. PostgreSQL is listening on the expected host and port

### Port Already in Use

If port 6072 is already in use, you can change it by:

1. Setting environment variable:
   ```bash
   # Windows PowerShell
   $env:SERVER_PORT="8072"
   
   # Linux/Mac
   export SERVER_PORT=8072
   ```

2. Or modifying `src/main/resources/application.yml`:
   ```yaml
   server:
     port: 8072
   ```

### Check Application Logs

The application logs will show detailed information about startup and any errors encountered.

## Next Steps

- Configure file upload limits if needed
- Set up additional database schemas
- Configure actuator endpoints as required
- Review and customize security settings

