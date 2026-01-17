-- SQL script to fix SystemSetting table permissions
-- Run this as a database administrator (e.g., postgres user)

-- First, check who owns the table
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'SystemSetting';

-- Grant permissions to the application user
-- The application uses 'strata_user' as the database user
-- Run this as the postgres superuser or table owner

GRANT SELECT, INSERT, UPDATE, DELETE ON "SystemSetting" TO strata_user;

-- Verify permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'SystemSetting';

