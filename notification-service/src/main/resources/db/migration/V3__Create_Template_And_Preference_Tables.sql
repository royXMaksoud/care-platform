-- Create Notification Templates Table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(20) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    language VARCHAR(10) NOT NULL,
    subject VARCHAR(500),
    body TEXT NOT NULL,
    html_body TEXT,
    text_body TEXT,
    expected_variables TEXT,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    is_rtl BOOLEAN DEFAULT false,
    max_length INTEGER,
    category VARCHAR(50),
    retry_policy TEXT,
    modified_by VARCHAR(100),
    modification_reason TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,

    CONSTRAINT uk_template_unique UNIQUE (template_name, language, version)
);

-- Create Indexes for Template Queries
CREATE INDEX IF NOT EXISTS idx_template_type ON notification_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_notification_type ON notification_templates(notification_type);
CREATE INDEX IF NOT EXISTS idx_language ON notification_templates(language);
CREATE INDEX IF NOT EXISTS idx_active ON notification_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_template_name ON notification_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_template_category ON notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_template_created_at ON notification_templates(created_at);

-- Create Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY,
    beneficiary_id UUID NOT NULL UNIQUE,
    preferred_channel VARCHAR(20) DEFAULT 'EMAIL',
    multi_channel_enabled BOOLEAN DEFAULT true,
    notify_appointment_created BOOLEAN DEFAULT true,
    notify_appointment_reminder BOOLEAN DEFAULT true,
    notify_appointment_cancelled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    sms_number VARCHAR(20),
    sms_verified BOOLEAN DEFAULT false,
    sms_verified_at TIMESTAMP,
    email_enabled BOOLEAN DEFAULT true,
    email_address VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    push_enabled BOOLEAN DEFAULT false,
    push_device_id VARCHAR(500),
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start VARCHAR(5),
    quiet_hours_end VARCHAR(5),
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    allow_marketing BOOLEAN DEFAULT false,
    gdpr_consent_given BOOLEAN DEFAULT false,
    gdpr_consent_date TIMESTAMP,
    digest_frequency VARCHAR(20) DEFAULT 'off',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,

    CONSTRAINT fk_preference_beneficiary FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id)
);

-- Create Indexes for Preference Queries
CREATE INDEX IF NOT EXISTS idx_beneficiary_pref ON notification_preferences(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_preferred_channel ON notification_preferences(preferred_channel);
CREATE INDEX IF NOT EXISTS idx_sms_enabled ON notification_preferences(sms_enabled);
CREATE INDEX IF NOT EXISTS idx_email_enabled ON notification_preferences(email_enabled);
CREATE INDEX IF NOT EXISTS idx_push_enabled ON notification_preferences(push_enabled);
CREATE INDEX IF NOT EXISTS idx_email_verified ON notification_preferences(email_verified);
CREATE INDEX IF NOT EXISTS idx_sms_verified ON notification_preferences(sms_verified);
CREATE INDEX IF NOT EXISTS idx_quiet_hours_enabled ON notification_preferences(quiet_hours_enabled);
CREATE INDEX IF NOT EXISTS idx_language ON notification_preferences(language);
CREATE INDEX IF NOT EXISTS idx_preference_created_at ON notification_preferences(created_at);

-- Create Audit Triggers for Templates
CREATE OR REPLACE FUNCTION update_notification_templates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notification_templates_update_timestamp ON notification_templates;
CREATE TRIGGER notification_templates_update_timestamp
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_templates_timestamp();

-- Create Audit Triggers for Preferences
CREATE OR REPLACE FUNCTION update_notification_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notification_preferences_update_timestamp ON notification_preferences;
CREATE TRIGGER notification_preferences_update_timestamp
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_timestamp();

-- Insert Default Templates
INSERT INTO notification_templates (
    id, template_name, template_type, notification_type, language,
    subject, body, expected_variables, version, is_active,
    category, is_rtl, created_at
) VALUES (
    gen_random_uuid(),
    'appointment_created_email_en',
    'EMAIL',
    'APPOINTMENT_CREATED',
    'en',
    'Your Appointment Confirmation - {{appointmentCode}}',
    'Dear {{beneficiaryName}}, Your appointment has been successfully created. Appointment Code: {{appointmentCode}}, Date: {{appointmentDate}}, Time: {{appointmentTime}}, Location: {{centerName}}, Service: {{serviceType}}',
    'beneficiaryName,appointmentCode,appointmentDate,appointmentTime,centerName,serviceType',
    1,
    true,
    'appointments',
    false,
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

INSERT INTO notification_templates (
    id, template_name, template_type, notification_type, language,
    subject, body, expected_variables, version, is_active,
    category, is_rtl, created_at
) VALUES (
    gen_random_uuid(),
    'appointment_created_email_ar',
    'EMAIL',
    'APPOINTMENT_CREATED',
    'ar',
    'تأكيد موعدك - {{appointmentCode}}',
    'عزيزي {{beneficiaryName}}, تم إنشاء موعدك بنجاح. رمز الموعد: {{appointmentCode}}, التاريخ: {{appointmentDate}}, الوقت: {{appointmentTime}}, المركز: {{centerName}}, الخدمة: {{serviceType}}',
    'beneficiaryName,appointmentCode,appointmentDate,appointmentTime,centerName,serviceType',
    1,
    true,
    'appointments',
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;
