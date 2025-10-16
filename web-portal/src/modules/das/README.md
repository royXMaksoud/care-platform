# Data Analysis Service (DAS) Module

## Overview
The DAS module is a comprehensive data analysis and exploration tool integrated into the Care web portal. It provides a RapidMiner/Orange-style interface for:
- File upload and management
- Dataset registration and profiling
- Data quality validation
- Exploratory Data Analysis (EDA)
- Chart generation and visualization
- Dataset joins
- Pipeline execution
- Asynchronous job monitoring

## Module Structure

```
das/
├── api/                    # API client modules
│   ├── datasets.ts         # Dataset CRUD operations
│   ├── files.ts            # File upload and management
│   ├── columns.ts          # Column analysis and summary
│   ├── validate.ts         # Data quality validation
│   ├── join.ts             # Dataset join operations
│   ├── pipelines.ts        # Pipeline execution
│   └── jobs.ts             # Async job monitoring
│
├── components/             # React components
│   ├── UploadPanel.tsx     # File upload with drag-and-drop
│   ├── DatasetTable.tsx    # Dataset list display
│   ├── DatasetHeader.tsx   # Dataset metadata view
│   ├── ProfileTable.tsx    # Data profiling table
│   ├── ColumnDrawer.tsx    # Column details drawer
│   ├── ChartsPanel.tsx     # Chart visualizations
│   ├── QualityBuilder.tsx  # Data quality rule builder
│   ├── JoinBuilder.tsx     # Dataset join configuration
│   ├── PipelineRunner.tsx  # Pipeline execution UI
│   └── JobCenter.tsx       # Job monitoring dashboard
│
├── hooks/                  # Custom React hooks
│   ├── useDatasets.ts      # Dataset management hook
│   ├── useDatasetProfile.ts # Profile fetching hook
│   ├── useColumnSummary.ts # Column analysis hook
│   ├── useValidation.ts    # Validation hook
│   ├── useJoin.ts          # Join operations hook
│   ├── usePipelines.ts     # Pipeline execution hook
│   └── useJobs.ts          # Job monitoring hook
│
├── pages/                  # Page components
│   ├── DasHome.tsx         # Main landing page
│   ├── DatasetDetails.tsx  # Dataset detail view
│   └── RoutesGuard.tsx     # Route protection
│
├── routes.jsx              # Route configuration
├── types.ts                # TypeScript type definitions
└── index.ts                # Module exports

```

## Backend Service Configuration

The DAS module communicates with the `data-analysis-service` backend running on port **6072**.

### Service Registration
The service is registered in `/config/services.ts`:
```typescript
export const SERVICES: Record<string, string> = {
  // ... other services
  das: '/das',
}
```

### API Gateway
All requests are proxied through the gateway at: `http://localhost:6060/das`

### Environment Variables
```env
VITE_API_URL=http://localhost:6060  # API Gateway URL
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/das` | `DasHome` | Main landing page with file upload and dataset list |
| `/das/datasets/:datasetId` | `DatasetDetails` | Detailed dataset view with profiling and analysis |

## Features

### 1. File Upload
- Multi-file upload support
- Drag-and-drop interface
- Formats: CSV, Excel (XLSX, XLS)
- Automatic normalization to CSV
- File metadata tracking

### 2. Dataset Management
- Register datasets from uploaded files
- View dataset metadata
- Download datasets as CSV
- Pagination and filtering

### 3. Data Profiling
- Automatic type inference (STRING, INTEGER, DECIMAL, BOOLEAN, DATE, DATETIME)
- Null/valid/invalid counts
- Column statistics
- Sample values

### 4. Column Analysis
- Descriptive statistics (count, min, max, mean, std, quartiles)
- Value distribution
- Unique value counts
- Top value frequencies

### 5. Data Visualization
- Histograms for numeric columns
- Bar charts for categorical columns
- Time series plots for date columns
- Interactive charts using Recharts

### 6. Data Quality Validation
- Configurable validation rules:
  - Required fields
  - Type validation
  - Range validation (min/max)
  - Regex patterns
  - Allowed values
  - Length constraints
  - Uniqueness checks
- Violation reports with sample row indexes
- Export violations to CSV

### 7. Dataset Joins
- Pandas-like merge operations
- Join types: INNER, LEFT, RIGHT, FULL
- Multi-column joins
- Column selection and suffixes

### 8. Pipelines
- JSON-defined data workflows
- Reusable pipeline templates
- Operators: read, filter, select, cast, join, profile, validate
- DAG execution

### 9. Async Jobs
- Long-running task support
- Real-time progress tracking
- Server-Sent Events (SSE) for live updates
- Job status monitoring

## Dependencies

### External Libraries
- **Recharts** (v3.2.1) - Chart visualization library

### Internal Dependencies
- `@/lib/axios` - HTTP client with authentication
- `@/lib/http` - Service-based HTTP wrapper
- `@/config/services` - Service configuration

## Integration with Main App

### Step 1: Import Routes
In your main router configuration:
```javascript
import { dasRoutes } from '@/modules/das';

const routes = [
  // ... other routes
  ...dasRoutes,
];
```

### Step 2: Add Navigation Link
In your sidebar/navigation:
```jsx
<Link to="/das">Data Analysis</Link>
```

### Step 3: Configure Gateway
Ensure the API Gateway routes `/das/*` to `data-analysis-service:6072`

## API Endpoints

All endpoints are prefixed with `/das/api/`

### Files
- `POST /files/upload` - Upload files
- `GET /files` - List files (paginated)
- `GET /files/{fileId}` - Get file details
- `DELETE /files/{fileId}` - Delete file

### Datasets
- `POST /datasets/from-file/{fileId}` - Register dataset
- `GET /datasets` - List datasets (paginated)
- `GET /datasets/{datasetId}` - Get dataset details
- `GET /datasets/{datasetId}/profile` - Get dataset profile
- `GET /datasets/{datasetId}/download` - Download dataset
- `DELETE /datasets/{datasetId}` - Delete dataset

### Columns
- `GET /datasets/{datasetId}/columns/{columnName}/summary` - Column summary
- `GET /datasets/{datasetId}/columns/{columnName}/charts` - Chart data

### Validation
- `POST /datasets/{datasetId}/validate` - Validate dataset

### Join
- `POST /datasets/join` - Join datasets

### Pipelines
- `POST /pipelines/run` - Execute pipeline
- `GET /pipelines/templates` - Get pipeline templates

### Jobs
- `GET /jobs/{jobId}` - Get job status
- `GET /jobs/{jobId}/events` (SSE) - Subscribe to job updates

## Development

### Running Locally
```bash
# Start the web portal
npm run dev

# Start the backend service (in separate terminal)
cd ../data-analysis-service
./mvnw spring-boot:run
```

### Building
```bash
npm run build
```

### Type Checking
```bash
npx tsc --noEmit
```

## Next Steps

The module skeleton is now complete. The next steps will implement:

1. **Step 2**: Implement UploadPanel component with drag-and-drop
2. **Step 3**: Implement DatasetTable with sorting and filtering
3. **Step 4**: Implement ProfileTable with type indicators
4. **Step 5**: Implement ColumnDrawer with charts
5. **Step 6**: Implement QualityBuilder for validation rules
6. **Step 7**: Implement JoinBuilder for dataset merging
7. **Step 8**: Implement PipelineRunner for workflows
8. **Step 9**: Styling and UX improvements
9. **Step 10**: Integration testing

## License
Copyright © 2025 Care Portal. All rights reserved.

