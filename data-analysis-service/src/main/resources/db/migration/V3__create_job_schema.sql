-- Create job table in public schema

CREATE TABLE IF NOT EXISTS public.job_record (
    job_id UUID NOT NULL PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    progress INTEGER DEFAULT 0,
    result TEXT,
    error_message TEXT,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_status ON public.job_record(status);
CREATE INDEX IF NOT EXISTS idx_job_created_by ON public.job_record(created_by);
CREATE INDEX IF NOT EXISTS idx_job_created_at ON public.job_record(created_at);

COMMENT ON TABLE public.job_record IS 'Async job tracking';
COMMENT ON COLUMN public.job_record.status IS 'Job status: PENDING, RUNNING, SUCCEEDED, FAILED, CANCELLED';
COMMENT ON COLUMN public.job_record.progress IS 'Progress percentage (0-100)';

