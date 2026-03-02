import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DatabaseService } from './database.service';

/**
 * SQL for creating tenant-level tables inside a schema.
 * These replicate the Drizzle schemas in schema/school/ but as raw SQL
 * so they can be run dynamically inside any tenant schema.
 *
 * ORDER MATTERS — tables with foreign keys must come after their referenced tables.
 */
const TENANT_TABLES_SQL = `
  -- =========================================
  -- Core tables (Phase 1)
  -- =========================================

  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(255),
    role VARCHAR(30) NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS school_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    board VARCHAR(20) NOT NULL,
    udise_code VARCHAR(20),
    affiliation_number VARCHAR(50),
    logo_url VARCHAR(500),
    phone VARCHAR(15),
    email VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- =========================================
  -- Academic structure (Phase 2)
  -- =========================================

  CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    sort_order VARCHAR(5) NOT NULL DEFAULT '1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- =========================================
  -- RBAC (Phase 2)
  -- =========================================

  CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- =========================================
  -- Classes & Subjects (Phase 2)
  -- =========================================

  CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30) NOT NULL,
    numeric_order INT NOT NULL,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    class_teacher_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(10) NOT NULL,
    capacity INT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    subject_type VARCHAR(20) NOT NULL DEFAULT 'scholastic',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID,
    periods_per_week INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- =========================================
  -- Students (Phase 2)
  -- =========================================

  CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_number VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    blood_group VARCHAR(5),
    category VARCHAR(20),
    religion VARCHAR(30),
    nationality VARCHAR(30) DEFAULT 'Indian',
    aadhaar_number VARCHAR(12),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    class_id UUID NOT NULL REFERENCES classes(id),
    section_id UUID NOT NULL REFERENCES sections(id),
    roll_number INT,
    admission_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    photo_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS student_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    relation VARCHAR(30) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    occupation VARCHAR(100),
    address TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS student_class_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id),
    section_id UUID NOT NULL REFERENCES sections(id),
    academic_year_id UUID NOT NULL,
    roll_number INT,
    action VARCHAR(20) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- =========================================
  -- Teachers (Phase 2)
  -- =========================================

  CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    employee_id VARCHAR(30),
    qualification VARCHAR(200),
    specialization VARCHAR(200),
    experience_years INT DEFAULT 0,
    date_of_joining VARCHAR(10),
    designation VARCHAR(100),
    is_class_teacher BOOLEAN NOT NULL DEFAULT false,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS teacher_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    section_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- =========================================
  -- Seed default roles & permissions
  -- =========================================

  INSERT INTO roles (name, display_name, description) VALUES
    ('school_admin', 'School Admin', 'Full access to all school modules'),
    ('vice_principal', 'Vice Principal', 'Administrative access except billing'),
    ('teacher', 'Teacher', 'Access to classes, students, attendance, exams'),
    ('accountant', 'Accountant', 'Access to fee management and reports'),
    ('staff', 'Staff', 'Limited access to assigned modules'),
    ('parent', 'Parent', 'Read-only access to child data')
  ON CONFLICT (name) DO NOTHING;

  INSERT INTO permissions (name, module, action, description) VALUES
    ('school_profile.manage', 'school_profile', 'manage', 'Manage school profile'),
    ('users.read', 'users', 'read', 'View users'),
    ('users.write', 'users', 'write', 'Create and edit users'),
    ('users.delete', 'users', 'delete', 'Delete users'),
    ('classes.read', 'classes', 'read', 'View classes and sections'),
    ('classes.write', 'classes', 'write', 'Create and edit classes'),
    ('subjects.read', 'subjects', 'read', 'View subjects'),
    ('subjects.write', 'subjects', 'write', 'Create and edit subjects'),
    ('students.read', 'students', 'read', 'View students'),
    ('students.write', 'students', 'write', 'Create and edit students'),
    ('students.delete', 'students', 'delete', 'Delete students'),
    ('students.import', 'students', 'import', 'Bulk import students'),
    ('teachers.read', 'teachers', 'read', 'View teachers'),
    ('teachers.write', 'teachers', 'write', 'Create and edit teachers'),
    ('attendance.read', 'attendance', 'read', 'View attendance'),
    ('attendance.write', 'attendance', 'write', 'Mark attendance'),
    ('fees.read', 'fees', 'read', 'View fee information'),
    ('fees.write', 'fees', 'write', 'Manage fees'),
    ('fees.collect', 'fees', 'collect', 'Collect fee payments'),
    ('exams.read', 'exams', 'read', 'View exam and results'),
    ('exams.write', 'exams', 'write', 'Manage exams and enter marks'),
    ('reports.read', 'reports', 'read', 'View reports'),
    ('communication.read', 'communication', 'read', 'View notices and messages'),
    ('communication.write', 'communication', 'write', 'Create notices and messages')
  ON CONFLICT (name) DO NOTHING;

  -- Assign all permissions to school_admin
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
  WHERE r.name = 'school_admin'
  ON CONFLICT DO NOTHING;

  -- Teacher permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
  WHERE r.name = 'teacher' AND p.name IN (
    'classes.read', 'subjects.read', 'students.read',
    'teachers.read', 'attendance.read', 'attendance.write',
    'exams.read', 'exams.write', 'communication.read'
  )
  ON CONFLICT DO NOTHING;

  -- Parent permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
  WHERE r.name = 'parent' AND p.name IN (
    'students.read', 'attendance.read', 'fees.read',
    'exams.read', 'reports.read', 'communication.read'
  )
  ON CONFLICT DO NOTHING;
`;

@Injectable()
export class TenantDatabaseService {
  private readonly logger = new Logger(TenantDatabaseService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create a new PostgreSQL schema for a tenant and run tenant migrations.
   * Schema name is derived from the tenant slug: "tenant_{slug}".
   */
  async createTenantSchema(slug: string): Promise<string> {
    const schemaName = this.getSchemaName(slug);
    this.logger.log(`Creating schema: ${schemaName}`);

    await this.databaseService.db.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`));

    return schemaName;
  }

  /**
   * Run tenant-specific migrations (create tables) inside a tenant schema.
   * Uses SET search_path to target the correct schema.
   */
  async runTenantMigrations(schemaName: string): Promise<void> {
    this.logger.log(`Running migrations for schema: ${schemaName}`);

    const pool = this.databaseService.getPool();
    const client = await pool.connect();
    try {
      // Set search_path to the tenant schema so tables are created there
      await client.query(`SET search_path TO "${schemaName}"`);
      await client.query(TENANT_TABLES_SQL);
      // Reset search_path
      await client.query(`SET search_path TO public`);
      this.logger.log(`Migrations completed for schema: ${schemaName}`);
    } finally {
      client.release();
    }
  }

  /**
   * Create the school admin user inside a tenant schema.
   * Returns the created user record.
   */
  async createSchoolAdmin(
    schemaName: string,
    data: { name: string; phone: string; email: string },
  ): Promise<{ id: string; name: string; phone: string; email: string; role: string }> {
    this.logger.log(`Creating school admin in schema: ${schemaName}`);

    const pool = this.databaseService.getPool();
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schemaName}"`);
      const result = await client.query(
        `INSERT INTO users (name, phone, email, role) VALUES ($1, $2, $3, 'admin') RETURNING id, name, phone, email, role`,
        [data.name, data.phone, data.email],
      );
      await client.query(`SET search_path TO public`);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Full provisioning: create schema + run migrations + create admin.
   * Runs inside a single connection with transaction-like behavior.
   * If any step fails, the schema is dropped (rollback).
   */
  async provisionTenantSchema(
    slug: string,
    admin: { name: string; phone: string; email: string },
  ): Promise<{
    schemaName: string;
    adminUser: { id: string; name: string; phone: string; email: string; role: string };
  }> {
    const schemaName = this.getSchemaName(slug);
    this.logger.log(`Provisioning tenant schema: ${schemaName}`);

    try {
      // Step 1: Create schema
      await this.createTenantSchema(slug);

      // Step 2: Run migrations (create tables)
      await this.runTenantMigrations(schemaName);

      // Step 3: Create school admin user
      const adminUser = await this.createSchoolAdmin(schemaName, admin);

      this.logger.log(`Provisioning complete for schema: ${schemaName}, admin: ${adminUser.id}`);
      return { schemaName, adminUser };
    } catch (error) {
      // Rollback: drop the schema if any step fails
      this.logger.error(`Provisioning failed for ${schemaName}, rolling back...`, error);
      try {
        await this.databaseService.db.execute(
          sql.raw(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`),
        );
        this.logger.warn(`Rolled back schema: ${schemaName}`);
      } catch (rollbackError) {
        this.logger.error(`Rollback also failed for ${schemaName}`, rollbackError);
      }
      throw error;
    }
  }

  /**
   * Drop a tenant schema (use with extreme caution).
   */
  async dropTenantSchema(slug: string): Promise<void> {
    const schemaName = this.getSchemaName(slug);
    this.logger.warn(`Dropping schema: ${schemaName}`);

    await this.databaseService.db.execute(sql.raw(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`));
  }

  /**
   * Check if a tenant schema exists.
   */
  async schemaExists(slug: string): Promise<boolean> {
    const schemaName = this.getSchemaName(slug);
    const result = await this.databaseService.db.execute(
      sql`SELECT schema_name FROM information_schema.schemata WHERE schema_name = ${schemaName}`,
    );
    return result.rows.length > 0;
  }

  /**
   * Convert tenant slug to schema name.
   * Sanitizes to prevent SQL injection.
   */
  getSchemaName(slug: string): string {
    const sanitized = slug.replace(/[^a-z0-9_]/g, '_');
    return `tenant_${sanitized}`;
  }
}
