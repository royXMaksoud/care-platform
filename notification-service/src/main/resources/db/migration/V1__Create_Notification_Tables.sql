-- Notification Service Database Schema
-- Version 1.0 - Initial notification persistence layer
-- Created: 2025-11-15

-- =============================================================================
-- NOTIFICATIONS TABLE - Core notification persistence and audit trail
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Idempotency key to prevent duplicate notifications
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,

    -- Beneficiary information
    beneficiary_id UUID NOT NULL,
    mobile_number VARCHAR(20),
    email VARCHAR(255),
    device_id VARCHAR(500),
    has_installed_mobile_app BOOLEAN DEFAULT false,

    -- Notification preferences and type
    preferred_channel VARCHAR(20),
    notification_type VARCHAR(50) NOT NULL,

    -- Delivery information
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    is_success BOOLEAN DEFAULT false,
    error_message TEXT,

    -- Retry mechanism
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP,

    -- Provider integration
    provider_message_id VARCHAR(500),
    provider_webhook_data TEXT,

    -- Appointment reference
    appointment_id UUID,
    appointment_code VARCHAR(50),

    -- Additional data
    metadata TEXT,
    template_id UUID,

    -- Timestamps
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Soft delete
    is_deleted BOOLEAN DEFAULT false
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_notifications_beneficiary_id ON notifications(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_notification_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_idempotency_key ON notifications(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_notifications_appointment_id ON notifications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status_retry ON notifications(status, retry_count, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_notifications_beneficiary_created ON notifications(beneficiary_id, created_at DESC);

-- =============================================================================
-- NOTIFICATION_PREFERENCES TABLE - User notification settings
-- =============================================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID NOT NULL UNIQUE,

    -- Channel preferences
    preferred_channel VARCHAR(20) DEFAULT 'EMAIL',
    multi_channel_enabled BOOLEAN DEFAULT true,

    -- Notification type preferences
    notify_appointment_created BOOLEAN DEFAULT true,
    notify_appointment_reminder BOOLEAN DEFAULT true,
    notify_appointment_cancelled BOOLEAN DEFAULT true,

    -- SMS preferences
    sms_enabled BOOLEAN DEFAULT false,
    sms_number VARCHAR(20),
    sms_verified BOOLEAN DEFAULT false,
    sms_verified_at TIMESTAMP,

    -- Email preferences
    email_enabled BOOLEAN DEFAULT true,
    email_address VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,

    -- Push preferences
    push_enabled BOOLEAN DEFAULT false,
    push_device_id VARCHAR(500),

    -- Quiet hours (no notifications between start and end times)
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start VARCHAR(5),  -- Format: HH:mm
    quiet_hours_end VARCHAR(5),    -- Format: HH:mm

    -- User preferences
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    allow_marketing BOOLEAN DEFAULT false,

    -- GDPR compliance
    gdpr_consent_given BOOLEAN DEFAULT false,
    gdpr_consent_date TIMESTAMP,

    -- Digest/batch preferences
    digest_frequency VARCHAR(20) DEFAULT 'off',  -- off, daily, weekly

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false
);

-- Create indexes for preferences table
CREATE INDEX IF NOT EXISTS idx_notification_preferences_beneficiary ON notification_preferences(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_language ON notification_preferences(language);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_email_verified ON notification_preferences(email_verified);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_sms_verified ON notification_preferences(sms_verified);

-- =============================================================================
-- NOTIFICATION_TEMPLATES TABLE - Email/SMS template management
-- =============================================================================
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Template identification
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(20) NOT NULL,  -- EMAIL, SMS, PUSH
    notification_type VARCHAR(50) NOT NULL,
    language VARCHAR(10) NOT NULL,

    -- Template content
    subject VARCHAR(500),
    body TEXT NOT NULL,
    html_body TEXT,
    text_body TEXT,

    -- Variables and configuration
    expected_variables TEXT,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    description TEXT,

    -- Language-specific settings
    is_rtl BOOLEAN DEFAULT false,
    max_length INTEGER,

    -- Organization
    category VARCHAR(50),

    -- Configuration
    retry_policy TEXT,

    -- Audit information
    modified_by VARCHAR(100),
    modification_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false
);

-- Create indexes for templates table
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_notification_type ON notification_templates(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_language ON notification_templates(language);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_templates_name ON notification_templates(template_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_templates_active_unique ON notification_templates(notification_type, language, template_type) WHERE is_active = true AND is_deleted = false;

-- =============================================================================
-- Insert Default System Templates
-- =============================================================================

-- English Appointment Created Email Template
INSERT INTO notification_templates (
    template_name, template_type, notification_type, language,
    subject, body, expected_variables, is_active, is_rtl, category
) VALUES (
    'appointment_created_email_en',
    'EMAIL',
    'APPOINTMENT_CREATED',
    'en',
    'Appointment Confirmation - {{appointmentCode}}',
    'Dear {{beneficiaryName}},

Your appointment has been successfully created.

Appointment Details:
- Code: {{appointmentCode}}
- Date: {{appointmentDate}}
- Time: {{appointmentTime}}
- Service: {{serviceType}}
- Center: {{centerName}}

Please save your appointment code for verification at the center.

Thank you,
Care Management System',
    'beneficiaryName,appointmentCode,appointmentDate,appointmentTime,serviceType,centerName',
    true,
    false,
    'appointments'
)
ON CONFLICT (notification_type, language, template_type) WHERE is_active = true DO NOTHING;

-- Arabic Appointment Created Email Template
INSERT INTO notification_templates (
    template_name, template_type, notification_type, language,
    subject, body, expected_variables, is_active, is_rtl, category
) VALUES (
    'appointment_created_email_ar',
    'EMAIL',
    'APPOINTMENT_CREATED',
    'ar',
    'تأكيد الموعد - {{appointmentCode}}',
    'السيد/السيدة {{beneficiaryName}},

تم إنشاء موعدك بنجاح.

تفاصيل الموعد:
- الكود: {{appointmentCode}}
- التاريخ: {{appointmentDate}}
- الوقت: {{appointmentTime}}
- الخدمة: {{serviceType}}
- المركز: {{centerName}}

يرجى حفظ كود الموعد للتحقق في المركز.

شكراً,
نظام إدارة الرعاية',
    'beneficiaryName,appointmentCode,appointmentDate,appointmentTime,serviceType,centerName',
    true,
    true,
    'appointments'
)
ON CONFLICT (notification_type, language, template_type) WHERE is_active = true DO NOTHING;

-- English Appointment Reminder SMS Template
INSERT INTO notification_templates (
    template_name, template_type, notification_type, language,
    subject, body, expected_variables, is_active, is_rtl, category, max_length
) VALUES (
    'appointment_reminder_sms_en',
    'SMS',
    'APPOINTMENT_REMINDER',
    'en',
    NULL,
    'Reminder: Your appointment is on {{appointmentDate}} at {{appointmentTime}} at {{centerName}}. Code: {{appointmentCode}}',
    'appointmentDate,appointmentTime,centerName,appointmentCode',
    true,
    false,
    'appointments',
    160
)
ON CONFLICT (notification_type, language, template_type) WHERE is_active = true DO NOTHING;

-- Arabic Appointment Reminder SMS Template
INSERT INTO notification_templates (
    template_name, template_type, notification_type, language,
    subject, body, expected_variables, is_active, is_rtl, category, max_length
) VALUES (
    'appointment_reminder_sms_ar',
    'SMS',
    'APPOINTMENT_REMINDER',
    'ar',
    NULL,
    'تذكير: موعدك في {{appointmentDate}} الساعة {{appointmentTime}} في {{centerName}}. الكود: {{appointmentCode}}',
    'appointmentDate,appointmentTime,centerName,appointmentCode',
    true,
    true,
    'appointments',
    160
)
ON CONFLICT (notification_type, language, template_type) WHERE is_active = true DO NOTHING;

-- =============================================================================
-- Create function to automatically update updated_at timestamp
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each table
DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON notifications;
CREATE TRIGGER trigger_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER trigger_notification_preferences_updated_at
BEFORE UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_notification_templates_updated_at ON notification_templates;
CREATE TRIGGER trigger_notification_templates_updated_at
BEFORE UPDATE ON notification_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- End of Database Schema
-- =============================================================================
