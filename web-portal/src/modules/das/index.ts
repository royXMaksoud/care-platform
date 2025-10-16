/**
 * DAS Module Index
 * Main export file for the Data Analysis Service module
 */

// Export routes
export { dasRoutes } from './routes';

// Export pages
export { DasHome } from './pages/DasHome';
export { DatasetDetails } from './pages/DatasetDetails';
export { RoutesGuard } from './pages/RoutesGuard';

// Export components
export { UploadPanel } from './components/UploadPanel';
export { DatasetTable } from './components/DatasetTable';
export { DatasetHeader } from './components/DatasetHeader';
export { ProfileTable } from './components/ProfileTable';
export { ColumnDrawer } from './components/ColumnDrawer';
export { ChartsPanel } from './components/ChartsPanel';
export { QualityBuilder } from './components/QualityBuilder';
export { JoinBuilder } from './components/JoinBuilder';
export { PipelineRunner } from './components/PipelineRunner';
export { JobCenter } from './components/JobCenter';

// Export hooks
export { useDatasets } from './hooks/useDatasets';
export { useDatasetProfile } from './hooks/useDatasetProfile';
export { useColumnSummary } from './hooks/useColumnSummary';
export { useValidation } from './hooks/useValidation';
export { useJoin } from './hooks/useJoin';
export { usePipelines } from './hooks/usePipelines';
export { useJobs } from './hooks/useJobs';

// Export API modules
export { default as datasetsApi } from './api/datasets';
export { default as filesApi } from './api/files';
export { default as columnsApi } from './api/columns';
export { default as validateApi } from './api/validate';
export { default as joinApi } from './api/join';
export { default as pipelinesApi } from './api/pipelines';
export { default as jobsApi } from './api/jobs';

// Export types
export * from './types';

