import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TenantConnectionService } from '../../common/database/tenant-connection.service';

export interface StudentRow {
  id: string;
  admission_number: string;
  name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string | null;
  category: string | null;
  religion: string | null;
  aadhaar_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  class_id: string;
  section_id: string;
  roll_number: number | null;
  admission_date: string | null;
  is_active: boolean;
  photo_url: string | null;
  created_at: string;
}

export interface GuardianRow {
  id: string;
  student_id: string;
  name: string;
  relation: string;
  phone: string;
  email: string | null;
  occupation: string | null;
  address: string | null;
  is_primary: boolean;
  user_id: string | null;
}

interface ClassLookup {
  id: string;
  name: string;
}

interface SectionLookup {
  id: string;
  class_id: string;
  name: string;
}

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(private readonly tc: TenantConnectionService) {}

  // =========================================
  // CRUD
  // =========================================

  async findAll(filters?: {
    classId?: string;
    sectionId?: string;
    isActive?: boolean;
  }): Promise<StudentRow[]> {
    let query = `SELECT * FROM students WHERE 1=1`;
    const params: unknown[] = [];
    let idx = 1;

    if (filters?.classId) {
      query += ` AND class_id = $${idx++}`;
      params.push(filters.classId);
    }
    if (filters?.sectionId) {
      query += ` AND section_id = $${idx++}`;
      params.push(filters.sectionId);
    }
    if (filters?.isActive !== undefined) {
      query += ` AND is_active = $${idx++}`;
      params.push(filters.isActive);
    }

    query += ` ORDER BY roll_number, name`;
    const { rows } = await this.tc.query<StudentRow>(query, params);
    return rows;
  }

  async findOne(id: string): Promise<StudentRow & { guardians: GuardianRow[] }> {
    const { rows } = await this.tc.query<StudentRow>(`SELECT * FROM students WHERE id = $1`, [id]);
    if (rows.length === 0) throw new NotFoundException('Student not found');

    const { rows: guardians } = await this.tc.query<GuardianRow>(
      `SELECT * FROM student_guardians WHERE student_id = $1 ORDER BY is_primary DESC`,
      [id],
    );

    return { ...rows[0], guardians };
  }

  async create(data: {
    name: string;
    dateOfBirth: string;
    gender: string;
    bloodGroup?: string;
    category?: string;
    religion?: string;
    aadhaarNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    classId: string;
    sectionId: string;
    rollNumber?: number;
    admissionDate?: string;
    guardians?: Array<{
      name: string;
      relation: string;
      phone: string;
      email?: string;
      occupation?: string;
      address?: string;
      isPrimary?: boolean;
    }>;
  }): Promise<StudentRow> {
    const admissionNumber = await this.generateAdmissionNumber();

    const { rows } = await this.tc.query<StudentRow>(
      `INSERT INTO students (admission_number, name, date_of_birth, gender, blood_group, category, religion, aadhaar_number, address, city, state, pincode, class_id, section_id, roll_number, admission_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        admissionNumber,
        data.name,
        data.dateOfBirth,
        data.gender,
        data.bloodGroup ?? null,
        data.category ?? null,
        data.religion ?? null,
        data.aadhaarNumber ?? null,
        data.address ?? null,
        data.city ?? null,
        data.state ?? null,
        data.pincode ?? null,
        data.classId,
        data.sectionId,
        data.rollNumber ?? null,
        data.admissionDate ?? new Date().toISOString().slice(0, 10),
      ],
    );

    const student = rows[0];

    // Insert guardians
    if (data.guardians?.length) {
      for (const g of data.guardians) {
        await this.addGuardian(student.id, g);
      }
    }

    // Record in class history
    await this.recordClassHistory(student.id, data.classId, data.sectionId, 'admitted');

    this.logger.log(`Created student: ${student.name} (${admissionNumber})`);
    return student;
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      dateOfBirth: string;
      gender: string;
      bloodGroup: string;
      category: string;
      religion: string;
      aadhaarNumber: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      classId: string;
      sectionId: string;
      rollNumber: number;
      isActive: boolean;
    }>,
  ): Promise<StudentRow> {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      name: 'name',
      dateOfBirth: 'date_of_birth',
      gender: 'gender',
      bloodGroup: 'blood_group',
      category: 'category',
      religion: 'religion',
      aadhaarNumber: 'aadhaar_number',
      address: 'address',
      city: 'city',
      state: 'state',
      pincode: 'pincode',
      classId: 'class_id',
      sectionId: 'section_id',
      rollNumber: 'roll_number',
      isActive: 'is_active',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if ((data as Record<string, unknown>)[key] !== undefined) {
        setClauses.push(`${col} = $${idx++}`);
        params.push((data as Record<string, unknown>)[key]);
      }
    }

    if (setClauses.length === 0) return (await this.findOne(id)) as StudentRow;

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const { rows } = await this.tc.query<StudentRow>(
      `UPDATE students SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );
    if (rows.length === 0) throw new NotFoundException('Student not found');
    return rows[0];
  }

  async delete(id: string): Promise<void> {
    const { rowCount } = await this.tc.query(`DELETE FROM students WHERE id = $1`, [id]);
    if (rowCount === 0) throw new NotFoundException('Student not found');
  }

  // =========================================
  // Guardians
  // =========================================

  async addGuardian(
    studentId: string,
    data: {
      name: string;
      relation: string;
      phone: string;
      email?: string;
      occupation?: string;
      address?: string;
      isPrimary?: boolean;
    },
  ): Promise<GuardianRow> {
    const { rows } = await this.tc.query<GuardianRow>(
      `INSERT INTO student_guardians (student_id, name, relation, phone, email, occupation, address, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        studentId,
        data.name,
        data.relation,
        data.phone,
        data.email ?? null,
        data.occupation ?? null,
        data.address ?? null,
        data.isPrimary ?? false,
      ],
    );

    // Auto-create parent user if not exists
    await this.ensureParentUser(data.phone, data.name);

    return rows[0];
  }

  // =========================================
  // Promotion / Transfer
  // =========================================

  async promoteStudent(
    studentId: string,
    newClassId: string,
    newSectionId: string,
  ): Promise<StudentRow> {
    const student = await this.update(studentId, {
      classId: newClassId,
      sectionId: newSectionId,
    });
    await this.recordClassHistory(studentId, newClassId, newSectionId, 'promoted');
    return student;
  }

  // =========================================
  // Bulk CSV Import
  // =========================================

  async bulkImportFromCsv(
    csvRows: Array<{
      name: string;
      dateOfBirth: string;
      gender: string;
      className: string;
      sectionName: string;
      guardianName: string;
      guardianRelation?: string;
      guardianPhone: string;
      guardianEmail?: string;
      bloodGroup?: string;
      category?: string;
      religion?: string;
      address?: string;
    }>,
  ): Promise<{ imported: number; errors: Array<{ row: number; error: string }> }> {
    // Build class/section lookup maps
    const classMap = await this.buildClassLookup();
    const sectionMap = await this.buildSectionLookup();

    let imported = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      try {
        // Resolve class
        const classEntry = classMap.get(row.className.toLowerCase());
        if (!classEntry) {
          errors.push({ row: i + 1, error: `Class not found: ${row.className}` });
          continue;
        }

        // Resolve section
        const sectionKey = `${classEntry.id}:${row.sectionName.toLowerCase()}`;
        const sectionEntry = sectionMap.get(sectionKey);
        if (!sectionEntry) {
          errors.push({
            row: i + 1,
            error: `Section not found: ${row.sectionName} in ${row.className}`,
          });
          continue;
        }

        await this.create({
          name: row.name,
          dateOfBirth: row.dateOfBirth,
          gender: row.gender,
          bloodGroup: row.bloodGroup,
          category: row.category,
          religion: row.religion,
          address: row.address,
          classId: classEntry.id,
          sectionId: sectionEntry.id,
          guardians: [
            {
              name: row.guardianName,
              relation: row.guardianRelation ?? 'guardian',
              phone: row.guardianPhone,
              email: row.guardianEmail,
              isPrimary: true,
            },
          ],
        });
        imported++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        errors.push({ row: i + 1, error: msg });
      }
    }

    this.logger.log(`CSV import: ${imported} students imported, ${errors.length} errors`);
    return { imported, errors };
  }

  // =========================================
  // Helpers
  // =========================================

  private async generateAdmissionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { rows } = await this.tc.query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM students`,
    );
    const seq = parseInt(rows[0].count, 10) + 1;
    return `ADM${year}${String(seq).padStart(4, '0')}`;
  }

  private async recordClassHistory(
    studentId: string,
    classId: string,
    sectionId: string,
    action: string,
  ): Promise<void> {
    // Get current academic year
    const { rows } = await this.tc.query<{ id: string }>(
      `SELECT id FROM academic_years WHERE is_current = true LIMIT 1`,
    );
    const academicYearId = rows[0]?.id ?? null;

    if (academicYearId) {
      await this.tc.query(
        `INSERT INTO student_class_history (student_id, class_id, section_id, academic_year_id, action)
         VALUES ($1, $2, $3, $4, $5)`,
        [studentId, classId, sectionId, academicYearId, action],
      );
    }
  }

  private async ensureParentUser(phone: string, name: string): Promise<void> {
    try {
      // Check if user already exists
      const { rows } = await this.tc.query<{ id: string }>(
        `SELECT id FROM users WHERE phone = $1`,
        [phone],
      );
      if (rows.length > 0) return;

      // Create parent user
      await this.tc.query(
        `INSERT INTO users (name, phone, role) VALUES ($1, $2, 'parent')
         ON CONFLICT (phone) DO NOTHING`,
        [name, phone],
      );

      // Assign parent role
      await this.tc.query(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT u.id, r.id FROM users u CROSS JOIN roles r
         WHERE u.phone = $1 AND r.name = 'parent'
         ON CONFLICT DO NOTHING`,
        [phone],
      );
    } catch (error) {
      this.logger.warn(`Could not auto-create parent user for ${phone}: ${error}`);
    }
  }

  private async buildClassLookup(): Promise<Map<string, ClassLookup>> {
    const { rows } = await this.tc.query<ClassLookup>(
      `SELECT id, name FROM classes WHERE is_active = true`,
    );
    const map = new Map<string, ClassLookup>();
    for (const r of rows) {
      map.set(r.name.toLowerCase(), r);
    }
    return map;
  }

  private async buildSectionLookup(): Promise<Map<string, SectionLookup>> {
    const { rows } = await this.tc.query<SectionLookup>(
      `SELECT id, class_id, name FROM sections WHERE is_active = true`,
    );
    const map = new Map<string, SectionLookup>();
    for (const r of rows) {
      map.set(`${r.class_id}:${r.name.toLowerCase()}`, r);
    }
    return map;
  }
}
