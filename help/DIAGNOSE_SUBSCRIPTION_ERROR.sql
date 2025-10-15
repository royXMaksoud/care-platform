-- =====================================================
-- 🔍 تشخيص مشكلة "Data integrity violation" (409)
-- =====================================================

-- 1️⃣ تحقق من وجود الـ Tenant
SELECT 
    tenant_id,
    name,
    email,
    is_active,
    is_deleted
FROM tenants 
WHERE tenant_id = '0bf65997-ac37-40e2-b54d-1fe71d3dcb40';

-- النتيجة المتوقعة:
-- ✅ إذا طلع سطر واحد → Tenant موجود (المشكلة مش هنا)
-- ❌ إذا ما طلع شي → Tenant مش موجود! (هذا السبب!)

-- =====================================================
-- 2️⃣ شوف الـ Constraints على الجدول
-- =====================================================
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'tenant_subscriptions'
AND tc.constraint_type IN ('FOREIGN KEY', 'UNIQUE', 'PRIMARY KEY')
ORDER BY tc.constraint_type, tc.constraint_name;

-- =====================================================
-- 3️⃣ شوف Subscriptions الموجودة للـ Tenant
-- =====================================================
SELECT 
    tenant_subscription_id,
    tenant_id,
    system_code,
    start_date,
    end_date,
    price,
    is_active,
    created_at
FROM tenant_subscriptions 
WHERE tenant_id = '0bf65997-ac37-40e2-b54d-1fe71d3dcb40'
ORDER BY created_at DESC;

-- =====================================================
-- 4️⃣ تحقق من جدول tenant_subscriptions
-- =====================================================
-- شوف إذا في بيانات غلط أو null
SELECT 
    COUNT(*) as total_count,
    COUNT(tenant_id) as with_tenant_id,
    COUNT(system_code) as with_system_code
FROM tenant_subscriptions;

-- =====================================================
-- 5️⃣ جرّب إضافة subscription يدوياً (للتشخيص)
-- =====================================================
/*
-- احذف هذا التعليق وجرّب:
INSERT INTO tenant_subscriptions (
    tenant_subscription_id,
    tenant_id,
    system_code,
    start_date,
    end_date,
    price,
    notes,
    is_active,
    is_deleted,
    created_at,
    row_version
) VALUES (
    gen_random_uuid(),
    '0bf65997-ac37-40e2-b54d-1fe71d3dcb40',
    'TEST-SYSTEM',
    '2025-10-01',
    '2025-10-31',
    1000.00,
    'Test subscription',
    true,
    false,
    NOW(),
    0
);

-- إذا نجح → المشكلة في الكود
-- إذا فشل → المشكلة في database constraints
*/

-- =====================================================
-- 6️⃣ إصلاح محتمل: إذا الـ Tenant مش موجود
-- =====================================================
/*
-- لو الـ tenant مش موجود، أنشئه:
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
    'Test Tenant',
    'test@example.com',
    '606943f0-a3ba-4449-a80f-0fab3b6dc5c1',  -- Dollar UUID
    'd1006514-0088-473b-8990-68f564cfa7f2',  -- Country UUID
    true,
    false,
    NOW(),
    0
);
*/

-- =====================================================
-- 7️⃣ إصلاح محتمل: حذف Constraint Unique (إذا موجود)
-- =====================================================
/*
-- لو في unique constraint على (tenant_id, system_code):
ALTER TABLE tenant_subscriptions 
DROP CONSTRAINT IF EXISTS uk_tenant_system_code;

-- بعدين جرّب الإضافة مرة ثانية
*/

