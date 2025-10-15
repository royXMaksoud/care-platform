-- =====================================================
-- 🚀 احصل على UUIDs - نفّذ هذا الآن!
-- =====================================================

-- إذا الجداول موجودة، احصل على UUIDs
SELECT 
    code,
    code_table_id
FROM code_tables
WHERE code IN ('INDUSTRY_TYPE', 'SUBSCRIPTION_PLAN', 'BILLING_CYCLE', 'COUNTRY')
AND is_active = true
ORDER BY code;

-- =====================================================
-- ⚠️ إذا النتيجة فارغة، نفّذ هذا لإنشاء الجداول:
-- =====================================================

/*
-- إنشاء الجداول
INSERT INTO code_tables (code_table_id, code, name, is_active, is_deleted, created_at)
VALUES 
    (gen_random_uuid(), 'INDUSTRY_TYPE', 'Industry Type', true, false, NOW()),
    (gen_random_uuid(), 'SUBSCRIPTION_PLAN', 'Subscription Plan', true, false, NOW()),
    (gen_random_uuid(), 'BILLING_CYCLE', 'Billing Cycle', true, false, NOW()),
    (gen_random_uuid(), 'COUNTRY', 'Country', true, false, NOW())
ON CONFLICT (code) DO NOTHING
RETURNING code, code_table_id;

-- ثم نفّذ أول SELECT مرة ثانية
*/

