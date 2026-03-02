import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TenantConnectionService } from '../../common/database/tenant-connection.service';

export interface ChildInfo {
  student_id: string;
  student_name: string;
  admission_number: string;
  class_name: string;
  section_name: string;
  roll_number: number | null;
  relation: string;
}

export interface GuardianProfile {
  guardian_id: string;
  student_id: string;
  name: string;
  relation: string;
  phone: string;
  email: string | null;
  occupation: string | null;
  address: string | null;
  is_primary: boolean;
}

@Injectable()
export class GuardiansService {
  private readonly logger = new Logger(GuardiansService.name);

  constructor(private readonly tc: TenantConnectionService) {}

  /**
   * Get all children linked to a parent user (via student_guardians.phone matching user.phone)
   */
  async getMyChildren(userId: string): Promise<ChildInfo[]> {
    const { rows } = await this.tc.query<ChildInfo>(
      `SELECT
         s.id as student_id,
         s.name as student_name,
         s.admission_number,
         c.name as class_name,
         sec.name as section_name,
         s.roll_number,
         sg.relation
       FROM student_guardians sg
       JOIN users u ON u.phone = sg.phone
       JOIN students s ON s.id = sg.student_id
       JOIN classes c ON c.id = s.class_id
       JOIN sections sec ON sec.id = s.section_id
       WHERE u.id = $1 AND s.is_active = true
       ORDER BY c.numeric_order, s.name`,
      [userId],
    );
    return rows;
  }

  /**
   * Get a specific child's full detail — only if the parent is linked
   */
  async getChildDetail(
    userId: string,
    studentId: string,
  ): Promise<{
    student: Record<string, unknown>;
    className: string;
    sectionName: string;
  }> {
    // Verify parent-child relationship
    const { rows: link } = await this.tc.query<{ student_id: string }>(
      `SELECT sg.student_id
       FROM student_guardians sg
       JOIN users u ON u.phone = sg.phone
       WHERE u.id = $1 AND sg.student_id = $2`,
      [userId, studentId],
    );

    if (link.length === 0) {
      throw new ForbiddenException('You do not have access to this student');
    }

    const { rows } = await this.tc.query<Record<string, unknown>>(
      `SELECT s.*, c.name as class_name, sec.name as section_name
       FROM students s
       JOIN classes c ON c.id = s.class_id
       JOIN sections sec ON sec.id = s.section_id
       WHERE s.id = $1`,
      [studentId],
    );

    if (rows.length === 0) throw new NotFoundException('Student not found');

    const student = rows[0];
    return {
      student,
      className: student['class_name'] as string,
      sectionName: student['section_name'] as string,
    };
  }

  /**
   * Get guardian's own profile info
   */
  async getMyProfile(userId: string): Promise<GuardianProfile[]> {
    const { rows } = await this.tc.query<GuardianProfile>(
      `SELECT sg.id as guardian_id, sg.student_id, sg.name, sg.relation, sg.phone, sg.email, sg.occupation, sg.address, sg.is_primary
       FROM student_guardians sg
       JOIN users u ON u.phone = sg.phone
       WHERE u.id = $1`,
      [userId],
    );
    return rows;
  }

  /**
   * Update guardian's contact info (only their own)
   */
  async updateMyProfile(
    userId: string,
    data: Partial<{ email: string; occupation: string; address: string }>,
  ): Promise<{ updated: number }> {
    // Get own phone
    const { rows: user } = await this.tc.query<{ phone: string }>(
      `SELECT phone FROM users WHERE id = $1`,
      [userId],
    );
    if (user.length === 0) throw new NotFoundException('User not found');

    const setClauses: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (data.email !== undefined) {
      setClauses.push(`email = $${idx++}`);
      params.push(data.email);
    }
    if (data.occupation !== undefined) {
      setClauses.push(`occupation = $${idx++}`);
      params.push(data.occupation);
    }
    if (data.address !== undefined) {
      setClauses.push(`address = $${idx++}`);
      params.push(data.address);
    }

    if (setClauses.length === 0) return { updated: 0 };

    params.push(user[0].phone);
    const { rowCount } = await this.tc.query(
      `UPDATE student_guardians SET ${setClauses.join(', ')} WHERE phone = $${idx}`,
      params,
    );

    return { updated: rowCount ?? 0 };
  }
}
