# Data Analysis Service - API Documentation

## Base URL
```
http://localhost:6072
```

## Authentication
All `/api/**` endpoints require JWT authentication:
```
Authorization: Bearer <jwt-token>
```

---

## 📁 File Management APIs

### 1. Upload Files

**Endpoint**: `POST /api/files/upload`

**Description**: Upload multiple CSV or Excel files. Excel files are automatically converted to CSV.

**Authorization**: ADMIN or ANALYST role

**Request**:
```http
POST /api/files/upload HTTP/1.1
Host: localhost:6072
Authorization: Bearer <token>
Content-Type: multipart/form-data

files: <file1.xlsx>
files: <file2.csv>
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "fileIds": [
      "123e4567-e89b-12d3-a456-426614174000",
      "223e4567-e89b-12d3-a456-426614174001"
    ],
    "files": [
      {
        "fileId": "123e4567-e89b-12d3-a456-426614174000",
        "originalFilename": "sales_data.xlsx",
        "storedFilename": "123e4567-e89b-12d3-a456-426614174000.csv",
        "originalFormat": "xlsx",
        "rowCount": 1000,
        "columnCount": 5,
        "status": "PROCESSED",
        "uploadedAt": "2025-10-16T08:00:00Z"
      }
    ],
    "totalFiles": 2,
    "successfulUploads": 2,
    "failedUploads": 0
  },
  "message": "Files uploaded successfully"
}
```

**Error Response** (400 Bad Request):
```json
{
  "code": "das.file.invalid.format",
  "message": "Invalid file format. Only Excel and CSV files are allowed",
  "status": 400,
  "timestamp": "2025-10-16T08:00:00",
  "path": "/api/files/upload"
}
```

### 2. Get File Info

**Endpoint**: `GET /api/files/{fileId}`

**Description**: Retrieve metadata for a specific file

**Authorization**: ADMIN or ANALYST role

**Request**:
```http
GET /api/files/123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Host: localhost:6072
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "fileId": "123e4567-e89b-12d3-a456-426614174000",
    "originalFilename": "sales_data.xlsx",
    "storedFilename": "123e4567-e89b-12d3-a456-426614174000.csv",
    "storagePath": "/path/to/storage/123e4567.csv",
    "originalFormat": "xlsx",
    "storedFormat": "csv",
    "originalSize": 2048000,
    "storedSize": 1536000,
    "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "rowCount": 1000,
    "columnCount": 5,
    "status": "PROCESSED",
    "isActive": true,
    "uploadedBy": "user-uuid",
    "uploadedAt": "2025-10-16T08:00:00Z"
  }
}
```

### 3. Delete File (Soft Delete)

**Endpoint**: `DELETE /api/files/{fileId}`

**Description**: Soft delete a file (marks as deleted, keeps in database)

**Authorization**: ADMIN role only

**Request**:
```http
DELETE /api/files/123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Host: localhost:6072
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": "File deleted successfully"
}
```

### 4. Permanently Delete File

**Endpoint**: `DELETE /api/files/{fileId}/permanent`

**Description**: Permanently delete file from storage and database

**Authorization**: ADMIN role only

**Request**:
```http
DELETE /api/files/123e4567-e89b-12d3-a456-426614174000/permanent HTTP/1.1
Host: localhost:6072
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": "File permanently deleted"
}
```

---

## 📊 Dataset Management APIs

### 1. Register Dataset from File

**Endpoint**: `POST /api/datasets/from-file/{fileId}`

**Description**: Create a dataset from an uploaded file. Automatically computes profile with type inference.

**Authorization**: ADMIN or ANALYST role

**Request**:
```http
POST /api/datasets/from-file/123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Host: localhost:6072
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Sales Data 2024",
  "description": "Monthly sales records for analysis"
}
```

**Note**: Request body is optional. If name is not provided, original filename will be used.

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "dataset-uuid",
    "message": "Dataset registered successfully"
  },
  "message": "Dataset registered successfully"
}
```

**Error Response** (400 Bad Request):
```json
{
  "code": "das.dataset.file.not.processed",
  "message": "File must be processed before registering dataset",
  "status": 400,
  "timestamp": "2025-10-16T08:00:00",
  "path": "/api/datasets/from-file/123e4567"
}
```

### 2. Get Dataset Info

**Endpoint**: `GET /api/datasets/{id}`

**Description**: Retrieve dataset metadata including name, rows, columns, and headers

**Authorization**: ADMIN or ANALYST role

**Request**:
```http
GET /api/datasets/dataset-uuid HTTP/1.1
Host: localhost:6072
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "datasetId": "dataset-uuid",
    "fileId": "file-uuid",
    "name": "Sales Data 2024",
    "description": "Monthly sales records for analysis",
    "rowCount": 1000,
    "columnCount": 5,
    "headers": [
      "product_name",
      "quantity",
      "price",
      "sale_date",
      "region"
    ],
    "status": "PROFILED",
    "isActive": true,
    "createdBy": "user-uuid",
    "createdAt": "2025-10-16T08:00:00Z"
  }
}
```

### 3. Get Dataset Profile

**Endpoint**: `GET /api/datasets/{id}/profile`

**Description**: Retrieve dataset profile with pandas-like dtype inference and column statistics

**Authorization**: ADMIN or ANALYST role

**Request**:
```http
GET /api/datasets/dataset-uuid/profile HTTP/1.1
Host: localhost:6072
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalRows": 1000,
    "totalColumns": 5,
    "columns": [
      {
        "columnName": "product_name",
        "columnIndex": 0,
        "dominantType": "STRING",
        "confidence": 1.0,
        "nullCount": 5,
        "nonNullCount": 995,
        "invalidTypeCount": 0,
        "examples": ["Widget A", "Gadget B", "Tool C", "Device D", "Item E"]
      },
      {
        "columnName": "quantity",
        "columnIndex": 1,
        "dominantType": "INTEGER",
        "confidence": 0.98,
        "nullCount": 0,
        "nonNullCount": 1000,
        "invalidTypeCount": 20,
        "examples": ["100", "250", "75", "500", "30"]
      },
      {
        "columnName": "price",
        "columnIndex": 2,
        "dominantType": "DECIMAL",
        "confidence": 1.0,
        "nullCount": 0,
        "nonNullCount": 1000,
        "invalidTypeCount": 0,
        "examples": ["29.99", "149.50", "9.95", "499.00", "15.25"]
      },
      {
        "columnName": "sale_date",
        "columnIndex": 3,
        "dominantType": "DATE",
        "confidence": 0.95,
        "nullCount": 10,
        "nonNullCount": 990,
        "invalidTypeCount": 50,
        "examples": ["2024-01-15", "2024-02-20", "2024-03-10"]
      },
      {
        "columnName": "region",
        "columnIndex": 4,
        "dominantType": "STRING",
        "confidence": 1.0,
        "nullCount": 2,
        "nonNullCount": 998,
        "invalidTypeCount": 0,
        "examples": ["North", "South", "East", "West", "Central"]
      }
    ]
  }
}
```

---

## 🧪 Test & Debug APIs

### 1. Test JWT Authentication

**Endpoint**: `GET /api/test/auth`

**Description**: Verify JWT authentication and view current user info

**Authorization**: Any authenticated user

**Request**:
```http
GET /api/test/auth HTTP/1.1
Host: localhost:6072
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "email": "analyst@example.com",
    "userType": "ANALYST",
    "language": "en",
    "roles": ["ANALYST"],
    "permissions": ["READ_DATA", "WRITE_DATA"],
    "timestamp": "2025-10-16T08:00:00"
  },
  "message": "Authentication successful"
}
```

### 2. Test Admin Role

**Endpoint**: `GET /api/test/admin`

**Authorization**: ADMIN role required

### 3. Test Analyst Role

**Endpoint**: `GET /api/test/analyst`

**Authorization**: ANALYST or ADMIN role

---

## 🏥 Health & Monitoring APIs

### Health Check

**Endpoint**: `GET /actuator/health`

**Authentication**: None required

**Response**:
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

### Metrics

**Endpoint**: `GET /actuator/metrics`

**Endpoint**: `GET /actuator/info`

---

## 📖 API Documentation

### Swagger UI
```
http://localhost:6072/swagger-ui.html
```

### OpenAPI Spec
```
http://localhost:6072/v3/api-docs
```

---

## 🔒 Authorization Matrix

| Endpoint | Method | ADMIN | ANALYST | Notes |
|----------|--------|-------|---------|-------|
| `/api/files/upload` | POST | ✅ | ✅ | Upload files |
| `/api/files/{id}` | GET | ✅ | ✅ | View file info |
| `/api/files/{id}` | DELETE | ✅ | ❌ | Soft delete |
| `/api/files/{id}/permanent` | DELETE | ✅ | ❌ | Hard delete |
| `/api/datasets/from-file/{fileId}` | POST | ✅ | ✅ | Register dataset |
| `/api/datasets/{id}` | GET | ✅ | ✅ | View dataset |
| `/api/datasets/{id}/profile` | GET | ✅ | ✅ | View profile |
| `/api/test/**` | GET | ✅ | ✅ | Test endpoints |
| `/actuator/**` | GET | Public | Public | No auth required |
| `/swagger-ui/**` | GET | Public | Public | No auth required |

---

## 🌐 i18n Support

### Language Selection
Language is extracted from JWT token `lang` field or `Accept-Language` header.

### Example with Arabic
```http
GET /api/datasets/invalid-uuid HTTP/1.1
Host: localhost:6072
Authorization: Bearer <token-with-lang-ar>

Response (404):
{
  "code": "das.dataset.not.found",
  "message": "لم يتم العثور على مجموعة البيانات: invalid-uuid",
  "status": 404,
  "timestamp": "2025-10-16T08:00:00",
  "path": "/api/datasets/invalid-uuid"
}
```

---

## 📊 Data Types Inference

### Supported Types

| Type | Examples | Patterns |
|------|----------|----------|
| STRING | "Hello", "ABC123" | Default fallback |
| INTEGER | 123, -456, 0 | Whole numbers |
| DECIMAL | 3.14, -0.5, 123.456 | Floating point |
| BOOLEAN | true, false, yes, no, 1, 0, t, f, y, n | Boolean values |
| DATE | 2024-01-15, 15/01/2024, 01/15/2024 | Multiple formats |
| DATETIME | 2024-01-15 10:30:00 | Date + time |

### Date Format Support
- ISO: `yyyy-MM-dd`
- European: `dd/MM/yyyy`, `dd-MM-yyyy`
- American: `MM/dd/yyyy`
- Flexible: `d/M/yyyy`, `d-M-yyyy`

### DateTime Format Support
- ISO: `yyyy-MM-ddTHH:mm:ss`
- Standard: `yyyy-MM-dd HH:mm:ss`
- European: `dd/MM/yyyy HH:mm:ss`
- American: `MM/dd/yyyy HH:mm:ss`

---

## 🔄 Complete Workflow Example

### Step-by-Step Usage

```bash
# Step 1: Login to get JWT token
curl -X POST http://localhost:6060/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "analyst@example.com",
    "password": "password123"
  }'

# Response includes: { "token": "eyJhbG..." }
export TOKEN="eyJhbG..."

# Step 2: Upload Excel file
curl -X POST http://localhost:6072/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@sales_data.xlsx"

# Response: { "data": { "fileIds": ["file-uuid"] } }

# Step 3: Register dataset from file
curl -X POST http://localhost:6072/api/datasets/from-file/file-uuid \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q4 Sales Analysis",
    "description": "Fourth quarter sales data"
  }'

# Response: { "data": { "id": "dataset-uuid" } }

# Step 4: Get dataset metadata
curl -X GET http://localhost:6072/api/datasets/dataset-uuid \
  -H "Authorization: Bearer $TOKEN"

# Response: Dataset info with headers and row/column counts

# Step 5: Get dataset profile with type inference
curl -X GET http://localhost:6072/api/datasets/dataset-uuid/profile \
  -H "Authorization: Bearer $TOKEN"

# Response: Full profile with column statistics and inferred types
```

---

## ⚠️ Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `das.file.empty` | 400 | File is empty |
| `das.file.invalid.format` | 400 | Invalid file format |
| `das.file.too.large` | 400 | File exceeds 200MB |
| `das.file.conversion.failed` | 400 | Excel conversion failed |
| `das.file.not.found` | 404 | File not found |
| `das.dataset.file.not.processed` | 400 | File not yet processed |
| `das.dataset.file.empty` | 400 | File has no data |
| `das.dataset.not.found` | 404 | Dataset not found |
| `das.dataset.profile.not.found` | 404 | Profile not available |
| `error.unauthorized` | 401 | No/invalid JWT token |
| `error.forbidden` | 403 | Insufficient permissions |

---

## 📋 Request/Response Models

### FileUploadResponse
```typescript
{
  fileId: UUID,
  originalFilename: string,
  storedFilename: string,
  originalFormat: string,  // "xlsx", "xls", "csv"
  rowCount: number,
  columnCount: number,
  status: string,          // "UPLOADED", "PROCESSING", "PROCESSED", "ERROR"
  errorMessage?: string,
  uploadedAt: ISO8601
}
```

### DatasetInfoResponse
```typescript
{
  datasetId: UUID,
  fileId: UUID,
  name: string,
  description?: string,
  rowCount: number,
  columnCount: number,
  headers: string[],
  status: string,          // "REGISTERED", "PROFILING", "PROFILED", "ERROR"
  isActive: boolean,
  createdBy: UUID,
  createdAt: ISO8601,
  updatedBy?: UUID,
  updatedAt?: ISO8601
}
```

### DatasetProfile
```typescript
{
  totalRows: number,
  totalColumns: number,
  columns: ColumnProfile[]
}

interface ColumnProfile {
  columnName: string,
  columnIndex: number,
  dominantType: "STRING"|"INTEGER"|"DECIMAL"|"BOOLEAN"|"DATE"|"DATETIME",
  confidence: number,        // 0.0 to 1.0
  nullCount: number,
  nonNullCount: number,
  invalidTypeCount: number,  // Values not matching dominant type
  examples: string[]         // First 5 non-null values
}
```

---

## 🔐 Security Notes

1. **All `/api/**` endpoints require JWT** authentication
2. **File operations** require ADMIN or ANALYST role
3. **Delete operations** require ADMIN role only
4. **Public endpoints**: `/actuator/**`, `/swagger-ui/**`, `/v3/api-docs/**`
5. **CORS enabled** for configured frontend origins

---

## 📚 Related Documentation

- `STEPS_3_TO_6_COMPLETE.md` - Implementation details
- `JWT_SECURITY_GUIDE.md` - Security and authentication
- `SHARED_LIB_INTEGRATION.md` - Using shared library components
- `README.md` - General overview

---

**Last Updated**: October 16, 2025  
**API Version**: 1.0  
**Service Port**: 6072

