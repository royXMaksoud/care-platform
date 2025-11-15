-- Create Notification Campaigns Table
CREATE TABLE IF NOT EXISTS notification_campaigns (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    notification_type VARCHAR(100) NOT NULL,
    template_id UUID,
    preferred_channel VARCHAR(50),
    target_beneficiary_count INTEGER,
    filter_criteria TEXT,
    template_variables TEXT,
    scheduled_for TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    error_summary TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,
    
    CONSTRAINT fk_campaign_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id)
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_campaign_status ON notification_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_created_at ON notification_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_scheduled_for ON notification_campaigns(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_campaign_tenant_id ON notification_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaign_template_id ON notification_campaigns(template_id);
CREATE INDEX IF NOT EXISTS idx_campaign_notification_type ON notification_campaigns(notification_type);

-- Add audit trigger for updated_at
CREATE OR REPLACE FUNCTION update_notification_campaigns_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notification_campaigns_update_timestamp ON notification_campaigns;
CREATE TRIGGER notification_campaigns_update_timestamp
    BEFORE UPDATE ON notification_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_campaigns_timestamp();
