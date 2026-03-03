import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantConnectionService } from '../../common/database/tenant-connection.service';

// =========================================
// Row interfaces (DB shape, snake_case)
// =========================================

export interface FeeHeadRow {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_recurring: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface FeeStructureRow {
  id: string;
  name: string;
  academic_year_id: string;
  class_id: string;
  fee_head_id: string;
  amount: number;
  due_date: string | null;
  term_id: string | null;
  is_active: boolean;
  created_at: string;
  // joined
  fee_head_name?: string;
  class_name?: string;
  term_name?: string;
}

export interface FeeDiscountRow {
  id: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  value: number;
  applicable_to: 'all' | 'category' | 'individual';
  category: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StudentFeeRow {
  id: string;
  student_id: string;
  fee_structure_id: string;
  discount_id: string | null;
  original_amount: number;
  discount_amount: number;
  net_amount: number;
  paid_amount: number;
  status: string;
  due_date: string | null;
  created_at: string;
  // joined
  student_name?: string;
  admission_number?: string;
  class_name?: string;
  fee_head_name?: string;
}

export interface FeePaymentRow {
  id: string;
  student_fee_id: string;
  student_id: string;
  amount: number;
  payment_mode: string;
  payment_date: string;
  transaction_id: string | null;
  razorpay_payment_id: string | null;
  receipt_number: string | null;
  remarks: string | null;
  collected_by: string | null;
  created_at: string;
  // joined
  student_name?: string;
  fee_head_name?: string;
  collected_by_name?: string;
}

interface CountRow {
  count: string;
}

@Injectable()
export class FeesService {
  private readonly logger = new Logger(FeesService.name);

  constructor(private readonly tc: TenantConnectionService) {}

  // =========================================
  // Fee Heads
  // =========================================

  async findAllFeeHeads(): Promise<FeeHeadRow[]> {
    const { rows } = await this.tc.query<FeeHeadRow>(
      `SELECT * FROM fee_heads ORDER BY sort_order, name`,
    );
    return rows;
  }

  async createFeeHead(data: {
    name: string;
    code?: string;
    description?: string;
    isRecurring?: boolean;
    sortOrder?: number;
  }): Promise<FeeHeadRow> {
    const { rows } = await this.tc.query<FeeHeadRow>(
      `INSERT INTO fee_heads (name, code, description, is_recurring, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.name,
        data.code ?? null,
        data.description ?? null,
        data.isRecurring ?? false,
        data.sortOrder ?? 0,
      ],
    );
    return rows[0];
  }

  async updateFeeHead(
    id: string,
    data: Partial<{
      name: string;
      code: string;
      description: string;
      isRecurring: boolean;
      isActive: boolean;
      sortOrder: number;
    }>,
  ): Promise<FeeHeadRow> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      sets.push(`name = $${idx++}`);
      params.push(data.name);
    }
    if (data.code !== undefined) {
      sets.push(`code = $${idx++}`);
      params.push(data.code);
    }
    if (data.description !== undefined) {
      sets.push(`description = $${idx++}`);
      params.push(data.description);
    }
    if (data.isRecurring !== undefined) {
      sets.push(`is_recurring = $${idx++}`);
      params.push(data.isRecurring);
    }
    if (data.isActive !== undefined) {
      sets.push(`is_active = $${idx++}`);
      params.push(data.isActive);
    }
    if (data.sortOrder !== undefined) {
      sets.push(`sort_order = $${idx++}`);
      params.push(data.sortOrder);
    }

    if (sets.length === 0) throw new BadRequestException('Nothing to update');

    sets.push(`updated_at = NOW()`);
    params.push(id);

    const { rows } = await this.tc.query<FeeHeadRow>(
      `UPDATE fee_heads SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );
    if (rows.length === 0) throw new NotFoundException('Fee head not found');
    return rows[0];
  }

  async deleteFeeHead(id: string): Promise<{ deleted: boolean }> {
    const { rowCount } = await this.tc.query(`DELETE FROM fee_heads WHERE id = $1`, [id]);
    if (rowCount === 0) throw new NotFoundException('Fee head not found');
    return { deleted: true };
  }

  // =========================================
  // Fee Structures
  // =========================================

  async findAllFeeStructures(filters?: {
    academicYearId?: string;
    classId?: string;
  }): Promise<FeeStructureRow[]> {
    let query = `
      SELECT fs.*,
             fh.name AS fee_head_name,
             c.name AS class_name,
             t.name AS term_name
      FROM fee_structures fs
      JOIN fee_heads fh ON fh.id = fs.fee_head_id
      JOIN classes c ON c.id = fs.class_id
      LEFT JOIN terms t ON t.id = fs.term_id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let idx = 1;

    if (filters?.academicYearId) {
      query += ` AND fs.academic_year_id = $${idx++}`;
      params.push(filters.academicYearId);
    }
    if (filters?.classId) {
      query += ` AND fs.class_id = $${idx++}`;
      params.push(filters.classId);
    }

    query += ` ORDER BY c.name, fh.sort_order, fh.name`;
    const { rows } = await this.tc.query<FeeStructureRow>(query, params);
    return rows;
  }

  async createFeeStructure(data: {
    name: string;
    academicYearId: string;
    classId: string;
    feeHeadId: string;
    amount: number;
    dueDate?: string;
    termId?: string;
  }): Promise<FeeStructureRow> {
    const { rows } = await this.tc.query<FeeStructureRow>(
      `INSERT INTO fee_structures (name, academic_year_id, class_id, fee_head_id, amount, due_date, term_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.name,
        data.academicYearId,
        data.classId,
        data.feeHeadId,
        data.amount,
        data.dueDate ?? null,
        data.termId ?? null,
      ],
    );
    return rows[0];
  }

  async updateFeeStructure(
    id: string,
    data: Partial<{
      name: string;
      amount: number;
      dueDate: string;
      isActive: boolean;
    }>,
  ): Promise<FeeStructureRow> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      sets.push(`name = $${idx++}`);
      params.push(data.name);
    }
    if (data.amount !== undefined) {
      sets.push(`amount = $${idx++}`);
      params.push(data.amount);
    }
    if (data.dueDate !== undefined) {
      sets.push(`due_date = $${idx++}`);
      params.push(data.dueDate);
    }
    if (data.isActive !== undefined) {
      sets.push(`is_active = $${idx++}`);
      params.push(data.isActive);
    }

    if (sets.length === 0) throw new BadRequestException('Nothing to update');

    sets.push(`updated_at = NOW()`);
    params.push(id);

    const { rows } = await this.tc.query<FeeStructureRow>(
      `UPDATE fee_structures SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );
    if (rows.length === 0) throw new NotFoundException('Fee structure not found');
    return rows[0];
  }

  async deleteFeeStructure(id: string): Promise<{ deleted: boolean }> {
    const { rowCount } = await this.tc.query(`DELETE FROM fee_structures WHERE id = $1`, [id]);
    if (rowCount === 0) throw new NotFoundException('Fee structure not found');
    return { deleted: true };
  }

  // =========================================
  // Fee Discounts
  // =========================================

  async findAllDiscounts(): Promise<FeeDiscountRow[]> {
    const { rows } = await this.tc.query<FeeDiscountRow>(
      `SELECT * FROM fee_discounts ORDER BY name`,
    );
    return rows;
  }

  async createDiscount(data: {
    name: string;
    discountType: 'percentage' | 'fixed';
    value: number;
    applicableTo?: 'all' | 'category' | 'individual';
    category?: string;
    description?: string;
  }): Promise<FeeDiscountRow> {
    const { rows } = await this.tc.query<FeeDiscountRow>(
      `INSERT INTO fee_discounts (name, discount_type, value, applicable_to, category, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.name,
        data.discountType,
        data.value,
        data.applicableTo ?? 'all',
        data.category ?? null,
        data.description ?? null,
      ],
    );
    return rows[0];
  }

  async updateDiscount(
    id: string,
    data: Partial<{
      name: string;
      discountType: string;
      value: number;
      applicableTo: string;
      category: string;
      description: string;
      isActive: boolean;
    }>,
  ): Promise<FeeDiscountRow> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      sets.push(`name = $${idx++}`);
      params.push(data.name);
    }
    if (data.discountType !== undefined) {
      sets.push(`discount_type = $${idx++}`);
      params.push(data.discountType);
    }
    if (data.value !== undefined) {
      sets.push(`value = $${idx++}`);
      params.push(data.value);
    }
    if (data.applicableTo !== undefined) {
      sets.push(`applicable_to = $${idx++}`);
      params.push(data.applicableTo);
    }
    if (data.category !== undefined) {
      sets.push(`category = $${idx++}`);
      params.push(data.category);
    }
    if (data.description !== undefined) {
      sets.push(`description = $${idx++}`);
      params.push(data.description);
    }
    if (data.isActive !== undefined) {
      sets.push(`is_active = $${idx++}`);
      params.push(data.isActive);
    }

    if (sets.length === 0) throw new BadRequestException('Nothing to update');

    sets.push(`updated_at = NOW()`);
    params.push(id);

    const { rows } = await this.tc.query<FeeDiscountRow>(
      `UPDATE fee_discounts SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );
    if (rows.length === 0) throw new NotFoundException('Discount not found');
    return rows[0];
  }

  // =========================================
  // Student Fees — Assignment
  // =========================================

  /**
   * Assign fee structures to all active students in a class.
   * Optionally filter to specific fee structure IDs; otherwise assigns all
   * active fee structures for the class in the given academic year.
   */
  async assignFeesToClass(data: {
    classId: string;
    academicYearId: string;
    feeStructureIds?: string[];
  }): Promise<{ assigned: number }> {
    // Find structures to assign
    let structQuery = `
      SELECT id, amount, due_date FROM fee_structures
      WHERE class_id = $1 AND academic_year_id = $2 AND is_active = true
    `;
    const structParams: unknown[] = [data.classId, data.academicYearId];

    if (data.feeStructureIds?.length) {
      structQuery += ` AND id = ANY($3)`;
      structParams.push(data.feeStructureIds);
    }

    const { rows: structures } = await this.tc.query<{
      id: string;
      amount: number;
      due_date: string | null;
    }>(structQuery, structParams);

    if (structures.length === 0) {
      throw new BadRequestException('No fee structures found for this class');
    }

    // Find active students in the class
    const { rows: students } = await this.tc.query<{ id: string }>(
      `SELECT id FROM students WHERE class_id = $1 AND is_active = true`,
      [data.classId],
    );

    if (students.length === 0) {
      throw new BadRequestException('No active students in this class');
    }

    let assigned = 0;

    for (const struct of structures) {
      for (const student of students) {
        // Skip if already assigned
        const { rows: existing } = await this.tc.query<{ id: string }>(
          `SELECT id FROM student_fees
           WHERE student_id = $1 AND fee_structure_id = $2`,
          [student.id, struct.id],
        );
        if (existing.length > 0) continue;

        await this.tc.query(
          `INSERT INTO student_fees
           (student_id, fee_structure_id, original_amount, discount_amount, net_amount, paid_amount, status, due_date)
           VALUES ($1, $2, $3, 0, $3, 0, 'pending', $4)`,
          [student.id, struct.id, struct.amount, struct.due_date],
        );
        assigned++;
      }
    }

    return { assigned };
  }

  /**
   * Assign all active fee structures for a class to a single student.
   * Returns the list of created student_fees rows.
   */
  async assignFeesToStudent(data: {
    studentId: string;
    classId: string;
    academicYearId: string;
  }): Promise<StudentFeeRow[]> {
    const { rows: structures } = await this.tc.query<{
      id: string;
      amount: number;
      due_date: string | null;
    }>(
      `SELECT id, amount, due_date FROM fee_structures
       WHERE class_id = $1 AND academic_year_id = $2 AND is_active = true`,
      [data.classId, data.academicYearId],
    );

    if (structures.length === 0) return [];

    const created: StudentFeeRow[] = [];

    for (const struct of structures) {
      // Skip if already assigned
      const { rows: existing } = await this.tc.query<{ id: string }>(
        `SELECT id FROM student_fees WHERE student_id = $1 AND fee_structure_id = $2`,
        [data.studentId, struct.id],
      );
      if (existing.length > 0) continue;

      const { rows } = await this.tc.query<StudentFeeRow>(
        `INSERT INTO student_fees
         (student_id, fee_structure_id, original_amount, discount_amount, net_amount, paid_amount, status, due_date)
         VALUES ($1, $2, $3, 0, $3, 0, 'pending', $4)
         RETURNING *`,
        [data.studentId, struct.id, struct.amount, struct.due_date],
      );
      created.push(rows[0]);
    }

    return created;
  }

  /**
   * Apply a discount to a single student's fee.
   */
  async applyDiscount(studentFeeId: string, discountId: string): Promise<StudentFeeRow> {
    const { rows: sfRows } = await this.tc.query<StudentFeeRow>(
      `SELECT * FROM student_fees WHERE id = $1`,
      [studentFeeId],
    );
    if (sfRows.length === 0) throw new NotFoundException('Student fee not found');

    const sf = sfRows[0];

    const { rows: discRows } = await this.tc.query<FeeDiscountRow>(
      `SELECT * FROM fee_discounts WHERE id = $1 AND is_active = true`,
      [discountId],
    );
    if (discRows.length === 0) throw new NotFoundException('Discount not found or inactive');

    const disc = discRows[0];
    let discountAmount: number;
    if (disc.discount_type === 'percentage') {
      discountAmount = Math.round((sf.original_amount * disc.value) / 10000); // value is percentage*100
    } else {
      discountAmount = disc.value;
    }

    const netAmount = Math.max(0, sf.original_amount - discountAmount);

    // Recalculate status
    let status = 'pending';
    if (sf.paid_amount >= netAmount) status = 'paid';
    else if (sf.paid_amount > 0) status = 'partial';

    const { rows } = await this.tc.query<StudentFeeRow>(
      `UPDATE student_fees
       SET discount_id = $1, discount_amount = $2, net_amount = $3, status = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [discountId, discountAmount, netAmount, status, studentFeeId],
    );
    return rows[0];
  }

  // =========================================
  // Student Fees — Listing
  // =========================================

  async findStudentFees(filters?: {
    studentId?: string;
    classId?: string;
    status?: string;
    academicYearId?: string;
  }): Promise<StudentFeeRow[]> {
    let query = `
      SELECT sf.*,
             s.name AS student_name,
             s.admission_number,
             c.name AS class_name,
             fh.name AS fee_head_name
      FROM student_fees sf
      JOIN fee_structures fs ON fs.id = sf.fee_structure_id
      JOIN students s ON s.id = sf.student_id
      JOIN classes c ON c.id = s.class_id
      JOIN fee_heads fh ON fh.id = fs.fee_head_id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let idx = 1;

    if (filters?.studentId) {
      query += ` AND sf.student_id = $${idx++}`;
      params.push(filters.studentId);
    }
    if (filters?.classId) {
      query += ` AND s.class_id = $${idx++}`;
      params.push(filters.classId);
    }
    if (filters?.status) {
      query += ` AND sf.status = $${idx++}`;
      params.push(filters.status);
    }
    if (filters?.academicYearId) {
      query += ` AND fs.academic_year_id = $${idx++}`;
      params.push(filters.academicYearId);
    }

    query += ` ORDER BY s.name, fh.sort_order`;
    const { rows } = await this.tc.query<StudentFeeRow>(query, params);
    return rows;
  }

  // =========================================
  // Fee Payments — Collection
  // =========================================

  /**
   * Collect a fee payment for a student's fee.
   * Supports partial payments. Updates student_fees.paid_amount and status.
   */
  async collectPayment(
    data: {
      studentFeeId: string;
      amount: number;
      paymentMode: string;
      paymentDate?: string;
      transactionId?: string;
      remarks?: string;
    },
    collectedBy: string,
  ): Promise<FeePaymentRow> {
    // Get the student fee
    const { rows: sfRows } = await this.tc.query<StudentFeeRow>(
      `SELECT * FROM student_fees WHERE id = $1`,
      [data.studentFeeId],
    );
    if (sfRows.length === 0) throw new NotFoundException('Student fee not found');
    const sf = sfRows[0];

    const remaining = sf.net_amount - sf.paid_amount;
    if (data.amount > remaining) {
      throw new BadRequestException(
        `Payment amount (${data.amount}) exceeds remaining balance (${remaining})`,
      );
    }

    // Generate receipt number: RCT-{YYYY}-{sequence}
    const year = new Date().getFullYear();
    const { rows: countRows } = await this.tc.query<CountRow>(
      `SELECT COUNT(*)::text AS count FROM fee_payments WHERE receipt_number LIKE $1`,
      [`RCT-${year}-%`],
    );
    const seq = parseInt(countRows[0].count, 10) + 1;
    const receiptNumber = `RCT-${year}-${String(seq).padStart(5, '0')}`;

    // Insert payment
    const { rows: payRows } = await this.tc.query<FeePaymentRow>(
      `INSERT INTO fee_payments
       (student_fee_id, student_id, amount, payment_mode, payment_date, transaction_id, receipt_number, remarks, collected_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.studentFeeId,
        sf.student_id,
        data.amount,
        data.paymentMode,
        data.paymentDate ?? new Date().toISOString().split('T')[0],
        data.transactionId ?? null,
        receiptNumber,
        data.remarks ?? null,
        collectedBy,
      ],
    );

    // Update student fee
    const newPaid = sf.paid_amount + data.amount;
    let status = 'partial';
    if (newPaid >= sf.net_amount) status = 'paid';

    await this.tc.query(
      `UPDATE student_fees SET paid_amount = $1, status = $2, updated_at = NOW() WHERE id = $3`,
      [newPaid, status, data.studentFeeId],
    );

    return payRows[0];
  }

  async findPayments(filters?: {
    studentId?: string;
    studentFeeId?: string;
  }): Promise<FeePaymentRow[]> {
    let query = `
      SELECT fp.*,
             s.name AS student_name,
             fh.name AS fee_head_name,
             u.name AS collected_by_name
      FROM fee_payments fp
      JOIN students s ON s.id = fp.student_id
      JOIN student_fees sf ON sf.id = fp.student_fee_id
      JOIN fee_structures fs ON fs.id = sf.fee_structure_id
      JOIN fee_heads fh ON fh.id = fs.fee_head_id
      LEFT JOIN users u ON u.id = fp.collected_by
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let idx = 1;

    if (filters?.studentId) {
      query += ` AND fp.student_id = $${idx++}`;
      params.push(filters.studentId);
    }
    if (filters?.studentFeeId) {
      query += ` AND fp.student_fee_id = $${idx++}`;
      params.push(filters.studentFeeId);
    }

    query += ` ORDER BY fp.payment_date DESC, fp.created_at DESC`;
    const { rows } = await this.tc.query<FeePaymentRow>(query, params);
    return rows;
  }

  // =========================================
  // Dashboard / Summary
  // =========================================

  async getFeeSummary(academicYearId?: string): Promise<{
    totalExpected: number;
    totalCollected: number;
    totalPending: number;
    totalOverdue: number;
    studentCount: number;
    paidCount: number;
    partialCount: number;
    overdueCount: number;
  }> {
    let whereClause = '';
    const params: unknown[] = [];

    if (academicYearId) {
      whereClause = `AND fs.academic_year_id = $1`;
      params.push(academicYearId);
    }

    const { rows } = await this.tc.query<{
      total_expected: string;
      total_collected: string;
      total_pending: string;
      student_count: string;
      paid_count: string;
      partial_count: string;
      overdue_count: string;
    }>(
      `SELECT
         COALESCE(SUM(sf.net_amount), 0)::text AS total_expected,
         COALESCE(SUM(sf.paid_amount), 0)::text AS total_collected,
         COALESCE(SUM(sf.net_amount - sf.paid_amount) FILTER (WHERE sf.status IN ('pending', 'partial', 'overdue')), 0)::text AS total_pending,
         COUNT(DISTINCT sf.student_id)::text AS student_count,
         COUNT(*) FILTER (WHERE sf.status = 'paid')::text AS paid_count,
         COUNT(*) FILTER (WHERE sf.status = 'partial')::text AS partial_count,
         COUNT(*) FILTER (WHERE sf.status = 'overdue')::text AS overdue_count
       FROM student_fees sf
       JOIN fee_structures fs ON fs.id = sf.fee_structure_id
       WHERE 1=1 ${whereClause}`,
      params,
    );

    const r = rows[0];
    const totalExpected = parseInt(r.total_expected, 10);
    const totalCollected = parseInt(r.total_collected, 10);

    return {
      totalExpected,
      totalCollected,
      totalPending: parseInt(r.total_pending, 10),
      totalOverdue: totalExpected - totalCollected, // simplified
      studentCount: parseInt(r.student_count, 10),
      paidCount: parseInt(r.paid_count, 10),
      partialCount: parseInt(r.partial_count, 10),
      overdueCount: parseInt(r.overdue_count, 10),
    };
  }

  /**
   * Get per-class fee collection summary.
   */
  async getClassWiseSummary(academicYearId: string): Promise<
    Array<{
      classId: string;
      className: string;
      totalExpected: number;
      totalCollected: number;
      studentCount: number;
    }>
  > {
    const { rows } = await this.tc.query<{
      class_id: string;
      class_name: string;
      total_expected: string;
      total_collected: string;
      student_count: string;
    }>(
      `SELECT
         c.id AS class_id,
         c.name AS class_name,
         COALESCE(SUM(sf.net_amount), 0)::text AS total_expected,
         COALESCE(SUM(sf.paid_amount), 0)::text AS total_collected,
         COUNT(DISTINCT sf.student_id)::text AS student_count
       FROM student_fees sf
       JOIN fee_structures fs ON fs.id = sf.fee_structure_id
       JOIN students s ON s.id = sf.student_id
       JOIN classes c ON c.id = s.class_id
       WHERE fs.academic_year_id = $1
       GROUP BY c.id, c.name
       ORDER BY c.name`,
      [academicYearId],
    );

    return rows.map((r) => ({
      classId: r.class_id,
      className: r.class_name,
      totalExpected: parseInt(r.total_expected, 10),
      totalCollected: parseInt(r.total_collected, 10),
      studentCount: parseInt(r.student_count, 10),
    }));
  }

  /**
   * Mark overdue fees: any student_fees with status 'pending' or 'partial'
   * whose due_date is in the past.
   */
  async markOverdueFees(): Promise<{ updated: number }> {
    const { rowCount } = await this.tc.query(
      `UPDATE student_fees
       SET status = 'overdue', updated_at = NOW()
       WHERE status IN ('pending', 'partial')
         AND due_date IS NOT NULL
         AND due_date < CURRENT_DATE`,
    );
    return { updated: rowCount };
  }

  /**
   * Waive a student fee entirely.
   */
  async waiveStudentFee(studentFeeId: string): Promise<StudentFeeRow> {
    const { rows } = await this.tc.query<StudentFeeRow>(
      `UPDATE student_fees
       SET status = 'waived', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [studentFeeId],
    );
    if (rows.length === 0) throw new NotFoundException('Student fee not found');
    return rows[0];
  }
}
