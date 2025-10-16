/**
 * Data Analysis Service (DAS) - Type Definitions
 * Defines all TypeScript types and interfaces for the DAS module
 */

// File Upload Types
export interface UploadedFile {
  fileId: string;
  originalFilename: string;
  storedFilename: string;
  originalFormat: string;
  storedFormat: string;
  originalSize: number;
  storedSize: number;
  rowCount: number;
  columnCount: number;
  status: 'UPLOADED' | 'PROCESSED' | 'ERROR';
  errorMessage?: string;
  uploadedAt: string;
}

// Dataset Types
export interface Dataset {
  datasetId: string;
  fileId: string;
  name: string;
  description?: string;
  rowCount: number;
  columnCount: number;
  header: string[];
  profileJson?: DatasetProfile;
  createdAt: string;
  updatedAt?: string;
}

// Profile Types
export interface DatasetProfile {
  columns: ColumnProfile[];
  totalRows: number;
  totalColumns: number;
}

export interface ColumnProfile {
  columnName: string;
  dominantType: 'STRING' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'DATE' | 'DATETIME';
  confidence: number;
  nullCount: number;
  validCount: number;
  invalidCount: number;
  uniqueCount?: number;
  examples: string[];
}

// Column Summary Types
export interface ColumnSummary {
  columnName: string;
  count: number;
  nulls: number;
  nonNulls: number;
  uniques?: number;
  min?: number;
  max?: number;
  mean?: number;
  std?: number;
  q25?: number;
  q50?: number;
  q75?: number;
  topValues?: Array<{ value: string; count: number }>;
}

// Chart Data Types
export interface ChartData {
  histogram?: HistogramData;
  categories?: CategoryData;
  timeseries?: TimeseriesData;
}

export interface HistogramData {
  bins: Array<{
    binStart: number;
    binEnd: number;
    frequency: number;
  }>;
  totalBins: number;
}

export interface CategoryData {
  entries: Array<{
    label: string;
    value: number;
  }>;
}

export interface TimeseriesData {
  points: Array<{
    time: string;
    value: number;
  }>;
}

// Data Quality Types
export interface DataQualityRule {
  column: string;
  required?: boolean;
  expectedType?: string;
  min?: number;
  max?: number;
  regex?: string;
  allowedValues?: string[];
  minLength?: number;
  maxLength?: number;
  unique?: boolean;
}

export interface DataQualityReport {
  datasetId: string;
  totalRows: number;
  totalViolations: number;
  ruleResults: RuleResult[];
  violationsCsvPath?: string;
  generatedAt: string;
}

export interface RuleResult {
  rule: DataQualityRule;
  violationCount: number;
  sampleRowIndexes: number[];
}

// Join Types
export interface JoinRequest {
  leftDatasetId: string;
  rightDatasetId: string;
  leftOn: string[];
  rightOn: string[];
  how: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  suffixes?: [string, string];
  selectColumns?: string[];
}

export interface JoinResult {
  datasetId: string;
  rows: number;
  columns: number;
}

// Pipeline Types
export interface Pipeline {
  name: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

export interface PipelineNode {
  id: string;
  op: string;
  params: Record<string, any>;
}

export interface PipelineEdge {
  from: string;
  to: string;
}

export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  pipeline: Pipeline;
}

export interface PipelineResult {
  success: boolean;
  results: Record<string, any>;
  generatedDatasetIds: string[];
  artifacts: string[];
}

// Job Types
export interface Job {
  jobId: string;
  type: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  progress: number;
  startTime?: string;
  endTime?: string;
  result?: any;
  errorMessage?: string;
}

// Forecast Types
export interface ForecastRequest {
  dateColumn: string;
  valueColumn: string;
  horizon: number;
}

export interface ForecastResult {
  actual: Array<{ time: string; value: number }>;
  forecast: Array<{ time: string; value: number }>;
  method: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// Filter Types
export interface FilterRequest {
  criteria?: FilterCriterion[];
  groups?: FilterGroup[];
  scopes?: string[];
}

export interface FilterCriterion {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN';
  value: any;
}

export interface FilterGroup {
  logic: 'AND' | 'OR';
  criteria: FilterCriterion[];
}

