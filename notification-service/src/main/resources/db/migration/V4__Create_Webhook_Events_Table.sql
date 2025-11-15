-- Create Webhook Events Table
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY,
    notification_id UUID NOT NULL,
    webhook_url VARCHAR(500) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    payload TEXT,
    response_code INTEGER,
    response_body TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 5,
    next_retry_at TIMESTAMP,
    signature VARCHAR(256),
    created_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,

    CONSTRAINT fk_webhook_notification FOREIGN KEY (notification_id) REFERENCES notifications(id)
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_webhook_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_notification ON webhook_events(notification_id);
CREATE INDEX IF NOT EXISTS idx_webhook_created_at ON webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_next_retry ON webhook_events(next_retry_at) WHERE status = 'pending';

-- Create Audit Trigger for updated_at
CREATE OR REPLACE FUNCTION update_webhook_events_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.processed_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_events_update_timestamp ON webhook_events;
CREATE TRIGGER webhook_events_update_timestamp
    BEFORE UPDATE ON webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_events_timestamp();
