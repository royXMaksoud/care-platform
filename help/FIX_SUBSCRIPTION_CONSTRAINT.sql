-- Fix for "Data integrity violation" on tenant_subscriptions update
-- This script removes any unique constraint on (tenantId, systemCode) if it exists

-- Step 1: Check existing constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    STRING_AGG(kcu.column_name, ', ') AS columns
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'tenant_subscriptions'
    AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
GROUP BY tc.constraint_name, tc.constraint_type;

-- Step 2: Drop unique constraint if exists (replace 'constraint_name_here' with actual name from Step 1)
-- Example:
-- ALTER TABLE tenant_subscriptions DROP CONSTRAINT IF EXISTS ux_tenant_system;
-- ALTER TABLE tenant_subscriptions DROP CONSTRAINT IF EXISTS tenant_subscriptions_tenant_id_system_code_key;

-- Step 3: Alternative - If you want to KEEP the unique constraint but allow updates,
-- you might need to check if there's a unique index instead:
-- DROP INDEX IF EXISTS ux_tenant_system;

-- Step 4: Verify the constraint/index is removed
SELECT 
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc
WHERE tc.table_name = 'tenant_subscriptions'
    AND tc.constraint_type = 'UNIQUE';

SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'tenant_subscriptions'
    AND indexdef LIKE '%UNIQUE%';

