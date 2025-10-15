-- =====================================================
-- 🚀 حل سريع: أنشئ الـ Tenant الناقص
-- =====================================================
-- نفّذ هذا الآن في قاعدة البيانات!

-- 1️⃣ أولاً: تحقق من وجود الـ Tenant
SELECT 
    tenant_id,
    name,
    email
FROM tenants 
WHERE tenant_id = '0bf65997-ac37-40e2-b54d-1fe71d3dcb40';

-- إذا ما طلع شي → الـ tenant مش موجود!
-- إذا طلع سطر واحد → الـ tenant موجود (المشكلة في شي ثاني)

-- =====================================================
-- 2️⃣ إنشاء الـ Tenant (نفّذ هذا إذا الـ tenant مش موجود)
-- =====================================================

INSERT INTO tenants (
    tenant_id,
    name,
    email,
    billing_currency_id,
    country_id,
    is_active,
    is_deleted,
    created_at,
    row_version
) VALUES (
    '0bf65997-ac37-40e2-b54d-1fe71d3dcb40',
    'UNHCR Organization',
    'contact@unhcr.org',
    '606943f0-a3ba-4449-a80f-0fab3b6dc5c1',  -- Dollar UUID
    'd1006514-0088-473b-8990-68f564cfa7f2',  -- Country UUID  
    true,
    false,
    NOW(),
    0
)
ON CONFLICT (tenant_id) DO NOTHING;

-- =====================================================
-- 3️⃣ تحقق من النتيجة
-- =====================================================

SELECT 
    tenant_id,
    name,
    email,
    is_active
FROM tenants 
WHERE tenant_id = '0bf65997-ac37-40e2-b54d-1fe71d3dcb40';

-- يجب أن ترى:
-- tenant_id: 0bf65997-ac37-40e2-b54d-1fe71d3dcb40
-- name: UNHCR Organization
-- email: contact@unhcr.org
-- is_active: true

-- =====================================================
-- 4️⃣ الآن جرّب إضافة Subscription من Frontend
-- =====================================================
-- يجب أن يشتغل بدون 409 error!

-- =====================================================
-- 🔍 إذا لسه ما اشتغل، نفّذ هذا:
-- =====================================================

-- تحقق من جميع constraints على tenant_subscriptions
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'tenant_subscriptions'::regclass
ORDER BY contype, conname;

-- النتيجة ستعرض لك جميع الـ constraints
-- ابحث عن:
-- - FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
-- - UNIQUE (tenant_id, system_code)

