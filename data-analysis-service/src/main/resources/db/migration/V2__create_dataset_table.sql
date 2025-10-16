-- Create dataset table

CREATE TABLE dataset (
    dataset_id UUID NOT NULL PRIMARY KEY,
    file_id UUID NOT NULL,
    name VARCHAR(500) NOT NULL,
    description VARCHAR(2000),
    row_count INTEGER,
    column_count INTEGER,
    header_json TEXT,
    profile_json TEXT,
    status VARCHAR(20) DEFAULT 'REGISTERED',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP,
    row_version BIGINT DEFAULT 0,
    
    -- Foreign key to uploaded_file
    CONSTRAINT fk_dataset_file FOREIGN KEY (file_id) 
        REFERENCES uploaded_file(file_id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_dataset_file_id ON dataset(file_id);
CREATE INDEX idx_dataset_created_by ON dataset(created_by);
CREATE INDEX idx_dataset_status ON dataset(status);
CREATE INDEX idx_dataset_is_deleted ON dataset(is_deleted);

-- Comments
COMMENT ON TABLE dataset IS 'Registered datasets with profiling information';
COMMENT ON COLUMN dataset.dataset_id IS 'Unique identifier for the dataset';
COMMENT ON COLUMN dataset.file_id IS 'Reference to the source uploaded file';
COMMENT ON COLUMN dataset.header_json IS 'CSV headers as JSON array';
COMMENT ON COLUMN dataset.profile_json IS 'Dataset profile with column statistics as JSON';
COMMENT ON COLUMN dataset.status IS 'Dataset status: REGISTERED, PROFILING, PROFILED, ERROR';

