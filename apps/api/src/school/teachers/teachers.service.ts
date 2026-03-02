import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { TenantConnectionService } from '../../common/database/tenant-connection.service';

export interface TeacherRow {
  id: string;
  user_id: string;
  employee_id: string;
  qualification: string | null;
  specialization: string | null;
  experience_years: number | null;
  designation: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TeacherWithUser extends TeacherRow {
  name: string;
  phone: string;
  email: string | null;
}

export interface TeacherSubjectRow {
  id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  section_id: string | null;
}

@Injectable()
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);

  constructor(private readonly tc: TenantConnectionService) {}

  // =========================================
  // CRUD
  // =========================================

  async findAll(filters?: { isActive?: boolean }): Promise<TeacherWithUser[]> {
    let query = `
      SELECT t.*, u.name, u.phone, u.email
      FROM teachers t
      JOIN users u ON u.id = t.user_id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let idx = 1;

    if (filters?.isActive !== undefined) {
      query += ` AND t.is_active = $${idx++}`;
      params.push(filters.isActive);
    }

    query += ` ORDER BY u.name`;
    const { rows } = await this.tc.query<TeacherWithUser>(query, params);
    return rows;
  }

  async findOne(id: string): Promise<TeacherWithUser & { subjects: TeacherSubjectRow[] }> {
    const { rows } = await this.tc.query<TeacherWithUser>(
      `SELECT t.*, u.name, u.phone, u.email
       FROM teachers t
       JOIN users u ON u.id = t.user_id
       WHERE t.id = $1`,
      [id],
    );
    if (rows.length === 0) throw new NotFoundException('Teacher not found');

    const { rows: subjects } = await this.tc.query<TeacherSubjectRow>(
      `SELECT * FROM teacher_subjects WHERE teacher_id = $1`,
      [id],
    );

    return { ...rows[0], subjects };
  }

  async create(data: {
    name: string;
    phone: string;
    email?: string;
    employeeId: string;
    qualification?: string;
    specialization?: string;
    experienceYears?: number;
    designation?: string;
  }): Promise<TeacherRow> {
    // First create or find the user
    const userId = await this.ensureTeacherUser(data.name, data.phone, data.email);

    // Check for duplicate employee ID
    const { rows: existing } = await this.tc.query<{ id: string }>(
      `SELECT id FROM teachers WHERE employee_id = $1`,
      [data.employeeId],
    );
    if (existing.length > 0) {
      throw new ConflictException(`Teacher with employee ID ${data.employeeId} already exists`);
    }

    // Check for duplicate user_id
    const { rows: existingUser } = await this.tc.query<{ id: string }>(
      `SELECT id FROM teachers WHERE user_id = $1`,
      [userId],
    );
    if (existingUser.length > 0) {
      throw new ConflictException(`A teacher profile already exists for this user`);
    }

    const { rows } = await this.tc.query<TeacherRow>(
      `INSERT INTO teachers (user_id, employee_id, qualification, specialization, experience_years, designation)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        userId,
        data.employeeId,
        data.qualification ?? null,
        data.specialization ?? null,
        data.experienceYears ?? null,
        data.designation ?? null,
      ],
    );

    this.logger.log(`Created teacher: ${data.name} (${data.employeeId})`);
    return rows[0];
  }

  async update(
    id: string,
    data: Partial<{
      qualification: string;
      specialization: string;
      experienceYears: number;
      designation: string;
      isActive: boolean;
    }>,
  ): Promise<TeacherRow> {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      qualification: 'qualification',
      specialization: 'specialization',
      experienceYears: 'experience_years',
      designation: 'designation',
      isActive: 'is_active',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if ((data as Record<string, unknown>)[key] !== undefined) {
        setClauses.push(`${col} = $${idx++}`);
        params.push((data as Record<string, unknown>)[key]);
      }
    }

    if (setClauses.length === 0) {
      const result = await this.findOne(id);
      return result;
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const { rows } = await this.tc.query<TeacherRow>(
      `UPDATE teachers SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );
    if (rows.length === 0) throw new NotFoundException('Teacher not found');
    return rows[0];
  }

  async delete(id: string): Promise<void> {
    const { rowCount } = await this.tc.query(`DELETE FROM teachers WHERE id = $1`, [id]);
    if (rowCount === 0) throw new NotFoundException('Teacher not found');
  }

  // =========================================
  // Subject Assignment
  // =========================================

  async assignSubject(
    teacherId: string,
    subjectId: string,
    classId: string,
    sectionId?: string,
  ): Promise<TeacherSubjectRow> {
    // Verify teacher exists
    await this.findOne(teacherId);

    const { rows } = await this.tc.query<TeacherSubjectRow>(
      `INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, section_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [teacherId, subjectId, classId, sectionId ?? null],
    );

    if (rows.length === 0) {
      throw new ConflictException('This subject assignment already exists');
    }

    return rows[0];
  }

  async removeSubjectAssignment(assignmentId: string): Promise<void> {
    const { rowCount } = await this.tc.query(`DELETE FROM teacher_subjects WHERE id = $1`, [
      assignmentId,
    ]);
    if (rowCount === 0) throw new NotFoundException('Assignment not found');
  }

  async getTeacherSubjects(
    teacherId: string,
  ): Promise<
    Array<
      TeacherSubjectRow & { subject_name: string; class_name: string; section_name: string | null }
    >
  > {
    const { rows } = await this.tc.query<
      TeacherSubjectRow & { subject_name: string; class_name: string; section_name: string | null }
    >(
      `SELECT ts.*, s.name as subject_name, c.name as class_name, sec.name as section_name
       FROM teacher_subjects ts
       JOIN subjects s ON s.id = ts.subject_id
       JOIN classes c ON c.id = ts.class_id
       LEFT JOIN sections sec ON sec.id = ts.section_id
       WHERE ts.teacher_id = $1
       ORDER BY c.numeric_order, s.name`,
      [teacherId],
    );
    return rows;
  }

  // =========================================
  // Helpers
  // =========================================

  private async ensureTeacherUser(name: string, phone: string, email?: string): Promise<string> {
    // Check if user with this phone exists
    const { rows: existing } = await this.tc.query<{ id: string }>(
      `SELECT id FROM users WHERE phone = $1`,
      [phone],
    );
    if (existing.length > 0) return existing[0].id;

    // Create user with teacher role
    const { rows } = await this.tc.query<{ id: string }>(
      `INSERT INTO users (name, phone, email, role) VALUES ($1, $2, $3, 'teacher') RETURNING id`,
      [name, phone, email ?? null],
    );

    const userId = rows[0].id;

    // Assign teacher role
    await this.tc.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, r.id FROM roles r WHERE r.name = 'teacher'
       ON CONFLICT DO NOTHING`,
      [userId],
    );

    return userId;
  }
}
