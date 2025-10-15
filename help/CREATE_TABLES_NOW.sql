-- =====================================================
-- 🚀 إنشاء الجداول الآن - نفّذ هذا السطر بالسطر
-- =====================================================

-- 1️⃣ إنشاء Code Tables
INSERT INTO code_tables (code_table_id, code, name, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), 'INDUSTRY_TYPE', 'Industry Type', true, false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM code_tables WHERE code = 'INDUSTRY_TYPE');

INSERT INTO code_tables (code_table_id, code, name, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), 'SUBSCRIPTION_PLAN', 'Subscription Plan', true, false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM code_tables WHERE code = 'SUBSCRIPTION_PLAN');

INSERT INTO code_tables (code_table_id, code, name, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), 'BILLING_CYCLE', 'Billing Cycle', true, false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM code_tables WHERE code = 'BILLING_CYCLE');

INSERT INTO code_tables (code_table_id, code, name, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), 'COUNTRY', 'Country', true, false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM code_tables WHERE code = 'COUNTRY');

-- 2️⃣ إضافة قيم تجريبية سريعة
-- Industry Types
INSERT INTO code_table_values (code_table_value_id, code_table_id, code, name, sort_order, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), ct.code_table_id, 'TECH', 'Technology', 1, true, false, NOW()
FROM code_tables ct WHERE ct.code = 'INDUSTRY_TYPE'
AND NOT EXISTS (SELECT 1 FROM code_table_values WHERE code_table_id = ct.code_table_id AND code = 'TECH');

INSERT INTO code_table_values (code_table_value_id, code_table_id, code, name, sort_order, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), ct.code_table_id, 'HEALTH', 'Healthcare', 2, true, false, NOW()
FROM code_tables ct WHERE ct.code = 'INDUSTRY_TYPE'
AND NOT EXISTS (SELECT 1 FROM code_table_values WHERE code_table_id = ct.code_table_id AND code = 'HEALTH');

-- Subscription Plans
INSERT INTO code_table_values (code_table_value_id, code_table_id, code, name, sort_order, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), ct.code_table_id, 'BASIC', 'Basic Plan', 1, true, false, NOW()
FROM code_tables ct WHERE ct.code = 'SUBSCRIPTION_PLAN'
AND NOT EXISTS (SELECT 1 FROM code_table_values WHERE code_table_id = ct.code_table_id AND code = 'BASIC');

INSERT INTO code_table_values (code_table_value_id, code_table_id, code, name, sort_order, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), ct.code_table_id, 'PRO', 'Professional Plan', 2, true, false, NOW()
FROM code_tables ct WHERE ct.code = 'SUBSCRIPTION_PLAN'
AND NOT EXISTS (SELECT 1 FROM code_table_values WHERE code_table_id = ct.code_table_id AND code = 'PRO');

-- Billing Cycles
INSERT INTO code_table_values (code_table_value_id, code_table_id, code, name, sort_order, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), ct.code_table_id, 'MONTHLY', 'Monthly', 1, true, false, NOW()
FROM code_tables ct WHERE ct.code = 'BILLING_CYCLE'
AND NOT EXISTS (SELECT 1 FROM code_table_values WHERE code_table_id = ct.code_table_id AND code = 'MONTHLY');

INSERT INTO code_table_values (code_table_value_id, code_table_id, code, name, sort_order, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), ct.code_table_id, 'YEARLY', 'Yearly', 2, true, false, NOW()
FROM code_tables ct WHERE ct.code = 'BILLING_CYCLE'
AND NOT EXISTS (SELECT 1 FROM code_table_values WHERE code_table_id = ct.code_table_id AND code = 'YEARLY');

-- Countries
INSERT INTO code_table_values (code_table_value_id, code_table_id, code, name, sort_order, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), ct.code_table_id, 'JO', 'Jordan', 1, true, false, NOW()
FROM code_tables ct WHERE ct.code = 'COUNTRY'
AND NOT EXISTS (SELECT 1 FROM code_table_values WHERE code_table_id = ct.code_table_id AND code = 'JO');

INSERT INTO code_table_values (code_table_value_id, code_table_id, code, name, sort_order, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), ct.code_table_id, 'USA', 'United States', 2, true, false, NOW()
FROM code_tables ct WHERE ct.code = 'COUNTRY'
AND NOT EXISTS (SELECT 1 FROM code_table_values WHERE code_table_id = ct.code_table_id AND code = 'USA');

-- 3️⃣ احصل على UUIDs للنسخ
SELECT 
    code,
    code_table_id,
    CONCAT('  ', code, ': ''', code_table_id, ''',') as "📋 COPY THIS TO codeTableIds.js"
FROM code_tables
WHERE code IN ('INDUSTRY_TYPE', 'SUBSCRIPTION_PLAN', 'BILLING_CYCLE', 'COUNTRY', 'CURRENCY')
AND is_active = true 
ORDER BY code;

