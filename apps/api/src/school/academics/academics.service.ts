import { Injectable, Logger } from '@nestjs/common';
import { TenantConnectionService } from '../../common/database/tenant-connection.service';

// =========================================
// Row types
// =========================================

export interface SchoolProfileRow {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  board: string;
  udise_code: string | null;
  affiliation_number: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

export interface AcademicYearRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface TermRow {
  id: string;
  academic_year_id: string;
  name: string;
  start_date: string;
  end_date: string;
  sort_order: string;
}

export interface ClassRow {
  id: string;
  name: string;
  numeric_order: number;
  academic_year_id: string;
  class_teacher_id: string | null;
  is_active: boolean;
}

export interface SectionRow {
  id: string;
  class_id: string;
  name: string;
  capacity: number | null;
  is_active: boolean;
}

export interface SubjectRow {
  id: string;
  name: string;
  code: string | null;
  subject_type: string;
  is_active: boolean;
}

export interface ClassSubjectRow {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  periods_per_week: number | null;
}

@Injectable()
export class AcademicsService {
  private readonly logger = new Logger(AcademicsService.name);

  constructor(private readonly tc: TenantConnectionService) {}

  // =========================================
  // School Profile
  // =========================================

  async getSchoolProfile(): Promise<SchoolProfileRow | null> {
    const { rows } = await this.tc.query<SchoolProfileRow>(`SELECT * FROM school_profile LIMIT 1`);
    return rows[0] ?? null;
  }

  async updateSchoolProfile(data: Partial<SchoolProfileRow>): Promise<SchoolProfileRow> {
    const existing = await this.getSchoolProfile();

    if (!existing) {
      // First time — insert
      const { rows } = await this.tc.query<SchoolProfileRow>(
        `INSERT INTO school_profile (name, address, city, state, pincode, board, udise_code, affiliation_number, logo_url, phone, email, website)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          data.name ?? '',
          data.address ?? null,
          data.city ?? null,
          data.state ?? null,
          data.pincode ?? null,
          data.board ?? 'cbse',
          data.udise_code ?? null,
          data.affiliation_number ?? null,
          data.logo_url ?? null,
          data.phone ?? null,
          data.email ?? null,
          data.website ?? null,
        ],
      );
      return rows[0];
    }

    // Update existing
    const { rows } = await this.tc.query<SchoolProfileRow>(
      `UPDATE school_profile SET
        name = COALESCE($1, name),
        address = COALESCE($2, address),
        city = COALESCE($3, city),
        state = COALESCE($4, state),
        pincode = COALESCE($5, pincode),
        board = COALESCE($6, board),
        udise_code = COALESCE($7, udise_code),
        affiliation_number = COALESCE($8, affiliation_number),
        logo_url = COALESCE($9, logo_url),
        phone = COALESCE($10, phone),
        email = COALESCE($11, email),
        website = COALESCE($12, website),
        updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [
        data.name ?? null,
        data.address ?? null,
        data.city ?? null,
        data.state ?? null,
        data.pincode ?? null,
        data.board ?? null,
        data.udise_code ?? null,
        data.affiliation_number ?? null,
        data.logo_url ?? null,
        data.phone ?? null,
        data.email ?? null,
        data.website ?? null,
        existing.id,
      ],
    );
    return rows[0];
  }

  // =========================================
  // Academic Years
  // =========================================

  async getAcademicYears(): Promise<AcademicYearRow[]> {
    const { rows } = await this.tc.query<AcademicYearRow>(
      `SELECT * FROM academic_years ORDER BY start_date DESC`,
    );
    return rows;
  }

  async getCurrentAcademicYear(): Promise<AcademicYearRow | null> {
    const { rows } = await this.tc.query<AcademicYearRow>(
      `SELECT * FROM academic_years WHERE is_current = true LIMIT 1`,
    );
    return rows[0] ?? null;
  }

  async createAcademicYear(data: {
    name: string;
    startDate: string;
    endDate: string;
    isCurrent?: boolean;
  }): Promise<AcademicYearRow> {
    // If setting as current, unset others
    if (data.isCurrent) {
      await this.tc.query(`UPDATE academic_years SET is_current = false`);
    }

    const { rows } = await this.tc.query<AcademicYearRow>(
      `INSERT INTO academic_years (name, start_date, end_date, is_current)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.name, data.startDate, data.endDate, data.isCurrent ?? false],
    );
    this.logger.log(`Created academic year: ${data.name}`);
    return rows[0];
  }

  // =========================================
  // Terms
  // =========================================

  async getTerms(academicYearId: string): Promise<TermRow[]> {
    const { rows } = await this.tc.query<TermRow>(
      `SELECT * FROM terms WHERE academic_year_id = $1 ORDER BY sort_order`,
      [academicYearId],
    );
    return rows;
  }

  async createTerm(data: {
    academicYearId: string;
    name: string;
    startDate: string;
    endDate: string;
    sortOrder?: string;
  }): Promise<TermRow> {
    const { rows } = await this.tc.query<TermRow>(
      `INSERT INTO terms (academic_year_id, name, start_date, end_date, sort_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.academicYearId, data.name, data.startDate, data.endDate, data.sortOrder ?? '1'],
    );
    return rows[0];
  }

  // =========================================
  // Classes
  // =========================================

  async getClasses(academicYearId?: string): Promise<ClassRow[]> {
    if (academicYearId) {
      const { rows } = await this.tc.query<ClassRow>(
        `SELECT * FROM classes WHERE academic_year_id = $1 ORDER BY numeric_order`,
        [academicYearId],
      );
      return rows;
    }
    // Default: current academic year
    const current = await this.getCurrentAcademicYear();
    if (!current) return [];
    const { rows } = await this.tc.query<ClassRow>(
      `SELECT * FROM classes WHERE academic_year_id = $1 ORDER BY numeric_order`,
      [current.id],
    );
    return rows;
  }

  async createClass(data: {
    name: string;
    numericOrder: number;
    academicYearId: string;
    classTeacherId?: string;
  }): Promise<ClassRow> {
    const { rows } = await this.tc.query<ClassRow>(
      `INSERT INTO classes (name, numeric_order, academic_year_id, class_teacher_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.name, data.numericOrder, data.academicYearId, data.classTeacherId ?? null],
    );
    this.logger.log(`Created class: ${data.name}`);
    return rows[0];
  }

  /**
   * Bulk-create standard Indian school classes (Nursery → Class 12) with default sections.
   */
  async seedDefaultClasses(academicYearId: string): Promise<{ classes: number; sections: number }> {
    const defaultClasses = [
      { name: 'Nursery', order: 0 },
      { name: 'LKG', order: 1 },
      { name: 'UKG', order: 2 },
      ...Array.from({ length: 12 }, (_, i) => ({ name: `Class ${i + 1}`, order: i + 3 })),
    ];

    let classCount = 0;
    let sectionCount = 0;

    for (const cls of defaultClasses) {
      const created = await this.createClass({
        name: cls.name,
        numericOrder: cls.order,
        academicYearId,
      });
      classCount++;

      // Create default sections A, B
      for (const secName of ['A', 'B']) {
        await this.createSection({ classId: created.id, name: secName });
        sectionCount++;
      }
    }

    this.logger.log(`Seeded ${classCount} classes with ${sectionCount} sections`);
    return { classes: classCount, sections: sectionCount };
  }

  // =========================================
  // Sections
  // =========================================

  async getSections(classId: string): Promise<SectionRow[]> {
    const { rows } = await this.tc.query<SectionRow>(
      `SELECT * FROM sections WHERE class_id = $1 ORDER BY name`,
      [classId],
    );
    return rows;
  }

  async createSection(data: {
    classId: string;
    name: string;
    capacity?: number;
  }): Promise<SectionRow> {
    const { rows } = await this.tc.query<SectionRow>(
      `INSERT INTO sections (class_id, name, capacity) VALUES ($1, $2, $3) RETURNING *`,
      [data.classId, data.name, data.capacity ?? null],
    );
    return rows[0];
  }

  // =========================================
  // Subjects
  // =========================================

  async getSubjects(): Promise<SubjectRow[]> {
    const { rows } = await this.tc.query<SubjectRow>(
      `SELECT * FROM subjects WHERE is_active = true ORDER BY name`,
    );
    return rows;
  }

  async createSubject(data: {
    name: string;
    code?: string;
    subjectType?: string;
  }): Promise<SubjectRow> {
    const { rows } = await this.tc.query<SubjectRow>(
      `INSERT INTO subjects (name, code, subject_type) VALUES ($1, $2, $3) RETURNING *`,
      [data.name, data.code ?? null, data.subjectType ?? 'scholastic'],
    );
    return rows[0];
  }

  /**
   * Seed default CBSE subjects.
   */
  async seedDefaultSubjects(board: string): Promise<SubjectRow[]> {
    const subjectList =
      board === 'cbse'
        ? [
            { name: 'English', code: 'ENG' },
            { name: 'Hindi', code: 'HIN' },
            { name: 'Mathematics', code: 'MATH' },
            { name: 'Science', code: 'SCI' },
            { name: 'Social Science', code: 'SST' },
            { name: 'Computer Science', code: 'CS' },
            { name: 'Physical Education', code: 'PE', type: 'co_scholastic' },
            { name: 'Art Education', code: 'ART', type: 'co_scholastic' },
            { name: 'Work Education', code: 'WE', type: 'co_scholastic' },
          ]
        : [
            { name: 'English', code: 'ENG' },
            { name: 'Hindi', code: 'HIN' },
            { name: 'Mathematics', code: 'MATH' },
            { name: 'Science', code: 'SCI' },
            { name: 'Social Studies', code: 'SS' },
            { name: 'Environmental Studies', code: 'EVS' },
          ];

    const created: SubjectRow[] = [];
    for (const sub of subjectList) {
      const row = await this.createSubject({
        name: sub.name,
        code: sub.code,
        subjectType: sub.type ?? 'scholastic',
      });
      created.push(row);
    }

    this.logger.log(`Seeded ${created.length} subjects for board: ${board}`);
    return created;
  }

  // =========================================
  // Class-Subject mapping
  // =========================================

  async getClassSubjects(classId: string): Promise<ClassSubjectRow[]> {
    const { rows } = await this.tc.query<ClassSubjectRow>(
      `SELECT * FROM class_subjects WHERE class_id = $1`,
      [classId],
    );
    return rows;
  }

  async assignClassSubject(data: {
    classId: string;
    subjectId: string;
    teacherId?: string;
    periodsPerWeek?: number;
  }): Promise<ClassSubjectRow> {
    const { rows } = await this.tc.query<ClassSubjectRow>(
      `INSERT INTO class_subjects (class_id, subject_id, teacher_id, periods_per_week)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.classId, data.subjectId, data.teacherId ?? null, data.periodsPerWeek ?? 0],
    );
    return rows[0];
  }
}
