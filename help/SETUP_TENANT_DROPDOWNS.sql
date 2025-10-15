-- =====================================================
-- 🚀 إعداد Tenant Dropdowns - نفّذ هذا مرة واحدة فقط
-- =====================================================

-- =====================================================
-- الخطوة 1️⃣: إنشاء Code Tables (إذا لم تكن موجودة)
-- =====================================================

-- INDUSTRY_TYPE
INSERT INTO code_tables (code_table_id, code, name, description, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), 'INDUSTRY_TYPE', 'Industry Type', 'Types of industries for tenants', true, false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM code_tables WHERE code = 'INDUSTRY_TYPE');

-- SUBSCRIPTION_PLAN
INSERT INTO code_tables (code_table_id, code, name, description, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), 'SUBSCRIPTION_PLAN', 'Subscription Plan', 'Available subscription plans', true, false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM code_tables WHERE code = 'SUBSCRIPTION_PLAN');

-- BILLING_CYCLE
INSERT INTO code_tables (code_table_id, code, name, description, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), 'BILLING_CYCLE', 'Billing Cycle', 'Billing cycle options', true, false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM code_tables WHERE code = 'BILLING_CYCLE');

-- COUNTRY
INSERT INTO code_tables (code_table_id, code, name, description, is_active, is_deleted, created_at)
SELECT gen_random_uuid(), 'COUNTRY', 'Country', 'List of countries', true, false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM code_tables WHERE code = 'COUNTRY');

-- =====================================================
-- الخطوة 2️⃣: إضافة قيم تجريبية
-- =====================================================

-- Industry Types
INSERT INTO code_table_values (code_table_value_id, code_table_id, code, name, sort_order, is_active, is_deleted, created_at)
SELECT 
    gen_random_uuid(), 
    ct.code_table_id, 
    vals.code, 
    vals.name, 
    vals.sort_order, 
    true, 
    false, 
    NOW()
FROM code_tables ct
CROSS JOIN (VALUES
    ('TECH', 'Technology', 1),
    ('HEALTH', 'Healthcare', 2),
    ('EDU', 'Education', 3),
    ('FIN', 'Finance', 4),
    ('RETAIL', 'Retail', 5),
    ('MFG', 'Manufacturing', 6),
    ('GOV', 'Government', 7),
    ('NGO', 'Non-Profit / NGO', 8),
    ('OTHER', 'Other', 99)
) AS vals(code, name, sort_order)
WHERE ct.code = 'INDUSTRY_TYPE'
AND NOT EXISTS (
    SELECT 1 FROM code_table_values ctv 
    WHERE ctv.code_table_id = ct.code_table_id 
    AND ctv.code = vals.code
);

-- Subscription Plans
INSERT INTO code_table_values (code_table_value_id, code_table_id, code, name, sort_order, is_active, is_deleted, created_at)
SELECT 
    gen_random_uuid(), 
    ct.code_table_id, 
    vals.code, 
    vals.name, 
    vals.sort_order, 
    true, 
    false, 
    NOW()
FROM code_tables ct
CROSS JOIN (VALUES
    ('FREE', 'Free Trial', 1),
    ('BASIC', 'Basic Plan', 2),
    ('PRO', 'Professional Plan', 3),
    ('BUSINESS', 'Business Plan', 4),
    ('ENTERPRISE', 'Enterprise Plan', 5)
) AS vals(code, name, sort_order)
WHERE ct.code = 'SUBSCRIPTION_PLAN'
AND NOT EXISTS (
    SELECT 1 FROM code_table_values ctv 
    WHERE ctv.code_table_id = ct.code_table_id 
    AND ctv.code = vals.code
);

-- Billing Cycles
INSERT INTO code_table_values (code_table_value_id, code_table_id, code, name, sort_order, is_active, is_deleted, created_at)
SELECT 
    gen_random_uuid(), 
    ct.code_table_id, 
    vals.code, 
    vals.name, 
    vals.sort_order, 
    true, 
    false, 
    NOW()
FROM code_tables ct
CROSS JOIN (VALUES
    ('MONTHLY', 'Monthly', 1),
    ('QUARTERLY', 'Quarterly (3 Months)', 2),
    ('SEMI_ANNUAL', 'Semi-Annual (6 Months)', 3),
    ('ANNUAL', 'Annual (Yearly)', 4),
    ('BIENNIAL', 'Biennial (2 Years)', 5)
) AS vals(code, name, sort_order)
WHERE ct.code = 'BILLING_CYCLE'
AND NOT EXISTS (
    SELECT 1 FROM code_table_values ctv 
    WHERE ctv.code_table_id = ct.code_table_id 
    AND ctv.code = vals.code
);

-- Countries (عينة)
INSERT INTO code_table_values (code_table_value_id, code_table_id, code, name, sort_order, is_active, is_deleted, created_at)
SELECT 
    gen_random_uuid(), 
    ct.code_table_id, 
    vals.code, 
    vals.name, 
    vals.sort_order, 
    true, 
    false, 
    NOW()
FROM code_tables ct
CROSS JOIN (VALUES
    ('JO', 'Jordan', 1),
    ('SA', 'Saudi Arabia', 2),
    ('AE', 'United Arab Emirates', 3),
    ('EG', 'Egypt', 4),
    ('USA', 'United States', 5),
    ('UK', 'United Kingdom', 6),
    ('DE', 'Germany', 7),
    ('FR', 'France', 8),
    ('CA', 'Canada', 9),
    ('AU', 'Australia', 10)
) AS vals(code, name, sort_order)
WHERE ct.code = 'COUNTRY'
AND NOT EXISTS (
    SELECT 1 FROM code_table_values ctv 
    WHERE ctv.code_table_id = ct.code_table_id 
    AND ctv.code = vals.code
);

-- =====================================================
-- الخطوة 3️⃣: احصل على UUIDs للتحديث في Frontend
-- =====================================================
SELECT 
    code,
    code_table_id,
    '  ' || code || ': ''' || code_table_id || ''',' as "📋 Copy to codeTableIds.js"
FROM code_tables
WHERE code IN ('INDUSTRY_TYPE', 'SUBSCRIPTION_PLAN', 'BILLING_CYCLE', 'COUNTRY', 'CURRENCY')
AND is_active = true 
ORDER BY code;

-- =====================================================
-- الخطوة 4️⃣: تحقق من النتائج
-- =====================================================
SELECT 
    ct.code as table_code,
    ct.name as table_name,
    COUNT(ctv.code_table_value_id) as total_values
FROM code_tables ct
LEFT JOIN code_table_values ctv 
    ON ct.code_table_id = ctv.code_table_id 
    AND ctv.is_active = true 
    AND ctv.is_deleted = false
WHERE ct.code IN ('INDUSTRY_TYPE', 'SUBSCRIPTION_PLAN', 'BILLING_CYCLE', 'COUNTRY', 'CURRENCY')
AND ct.is_active = true 
GROUP BY ct.code, ct.name
ORDER BY ct.code;

-- =====================================================
-- الخطوة 5️⃣: عرض كل القيم
-- =====================================================
SELECT 
    ct.code as table_code,
    ctv.code as value_code,
    ctv.name as value_name,
    ctv.sort_order
FROM code_tables ct
INNER JOIN code_table_values ctv 
    ON ct.code_table_id = ctv.code_table_id
WHERE ct.code IN ('INDUSTRY_TYPE', 'SUBSCRIPTION_PLAN', 'BILLING_CYCLE', 'COUNTRY', 'CURRENCY')
AND ct.is_active = true 
AND ctv.is_active = true 
AND ctv.is_deleted = false
ORDER BY ct.code, ctv.sort_order;

