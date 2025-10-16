-- Initial schema for Data Analysis Service

-- Create uploaded_file table
CREATE TABLE uploaded_file (
    file_id UUID NOT NULL PRIMARY KEY,
    original_filename VARCHAR(500) NOT NULL,
    stored_filename VARCHAR(500),
    storage_path VARCHAR(1000),
    original_format VARCHAR(10),
    stored_format VARCHAR(10) DEFAULT 'csv',
    original_size BIGINT,
    stored_size BIGINT,
    mime_type VARCHAR(100),
    row_count INTEGER,
    column_count INTEGER,
    status VARCHAR(20) DEFAULT 'UPLOADED',
    error_message VARCHAR(1000),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_by UUID,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP,
    row_version BIGINT DEFAULT 0
);

-- Create index on uploaded_by for faster queries
CREATE INDEX idx_uploaded_file_uploaded_by ON uploaded_file(uploaded_by);

-- Create index on status for filtering
CREATE INDEX idx_uploaded_file_status ON uploaded_file(status);

-- Create index on is_deleted for soft delete queries
CREATE INDEX idx_uploaded_file_is_deleted ON uploaded_file(is_deleted);

-- Comments for documentation
COMMENT ON TABLE uploaded_file IS 'Stores metadata for all uploaded files (CSV, Excel)';
COMMENT ON COLUMN uploaded_file.file_id IS 'Unique identifier for the file';
COMMENT ON COLUMN uploaded_file.original_filename IS 'Original name of the uploaded file';
COMMENT ON COLUMN uploaded_file.stored_filename IS 'Name of the file in storage (normalized to CSV)';
COMMENT ON COLUMN uploaded_file.storage_path IS 'Full path where file is stored';
COMMENT ON COLUMN uploaded_file.status IS 'Processing status: UPLOADED, PROCESSING, PROCESSED, ERROR';
COMMENT ON COLUMN uploaded_file.row_count IS 'Number of data rows (excluding header)';
COMMENT ON COLUMN uploaded_file.column_count IS 'Number of columns';


