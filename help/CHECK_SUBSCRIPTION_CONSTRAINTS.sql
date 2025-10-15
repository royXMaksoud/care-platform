-- Check for unique constraints on tenant_subscriptions table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    STRING_AGG(kcu.column_name, ', ') AS columns
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'tenant_subscriptions'
    AND tc.constraint_type = 'UNIQUE'
GROUP BY tc.constraint_name, tc.constraint_type;

-- Check all indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'tenant_subscriptions';

-- Check if the systemCode "يل" already exists for this tenant
SELECT 
    tenant_subscription_id,
    tenant_id,
    system_code,
    is_active,
    created_at
FROM tenant_subscriptions
WHERE tenant_id = '0bf65997-ac37-40e2-b54d-1fe71d3dcb40'
    AND system_code = 'يل';

-- Check all subscriptions for this tenant
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

