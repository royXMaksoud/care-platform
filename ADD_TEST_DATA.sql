-- Add Test Appointment Data for Dashboard
-- Run this in PostgreSQL if database is empty
-- This will create 50 test appointments for the last 30 days

-- First, check current data
-- SELECT COUNT(*) as total_appointments FROM appointments;

-- Add 50 test appointments
INSERT INTO appointments (
  appointment_id,
  beneficiary_id,
  organization_branch_id,
  service_type_id,
  appointment_date,
  appointment_time,
  appointment_status_id,
  priority,
  created_at
)
SELECT
  gen_random_uuid(),
  (SELECT beneficiary_id FROM beneficiaries LIMIT 1),
  (SELECT organization_branch_id FROM organization_branches LIMIT 1),
  (SELECT service_type_id FROM service_types LIMIT 1),
  CURRENT_DATE - (random() * 30)::int,
  ('09:00'::time + (random() * 8 || ' hours')::interval),
  (SELECT code_value_id FROM code_table_entries
   WHERE code_value IN ('COMPLETED', 'CANCELLED', 'NO_SHOW', 'CONFIRMED', 'REQUESTED')
   ORDER BY random() LIMIT 1),
  (ARRAY['URGENT', 'NORMAL'])[floor(random() * 2) + 1],
  NOW()
FROM generate_series(1, 50);

-- Verify data was added
SELECT COUNT(*) as total_appointments FROM appointments;

-- Check by status
SELECT
  code_value as status,
  COUNT(*) as count
FROM appointments a
JOIN code_table_entries c ON a.appointment_status_id = c.code_value_id
WHERE a.appointment_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY code_value
ORDER BY count DESC;
