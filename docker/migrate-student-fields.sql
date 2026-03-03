DO $$
DECLARE
  schema_name TEXT;
BEGIN
  FOR schema_name IN
    SELECT nspname FROM pg_namespace WHERE nspname LIKE 'tenant_%'
  LOOP
    EXECUTE format('ALTER TABLE %I.students ADD COLUMN IF NOT EXISTS phone VARCHAR(15)', schema_name);
    EXECUTE format('ALTER TABLE %I.students ADD COLUMN IF NOT EXISTS email VARCHAR(255)', schema_name);
    EXECUTE format('ALTER TABLE %I.student_guardians ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(15)', schema_name);
  END LOOP;
END $$;
