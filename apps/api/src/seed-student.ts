/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * Seed a realistic student with full data in the demo-school tenant.
 *
 * Seeds: academic year, terms, class, section, subjects, class-subjects,
 *        student, guardians, class history, fee heads, fee structures,
 *        student fees, and fee payments.
 *
 * Usage: npm run db:seed:student
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DatabaseService } from './common/database/database.service';
import { Logger } from '@nestjs/common';

const logger = new Logger('SeedStudent');
const SCHEMA = 'tenant_demo_school';

async function seedStudent() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  const databaseService = app.get(DatabaseService);
  const pool = databaseService.getPool();
  const client = await pool.connect();

  try {
    await client.query(`SET search_path TO "${SCHEMA}"`);

    // Check schema exists
    const schemaCheck = await client.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      [SCHEMA],
    );
    if (schemaCheck.rows.length === 0) {
      throw new Error(`Schema "${SCHEMA}" does not exist. Run "npm run db:seed" first.`);
    }

    // Check if student already exists
    const existing = await client.query(
      `SELECT id FROM students WHERE admission_number = 'ADM-2025-0001'`,
    );
    if (existing.rows.length > 0) {
      logger.log('Student ADM-2025-0001 already exists, skipping.');
      return;
    }

    logger.log('Seeding student data...');

    // ─── 1. Academic Year ───
    const ayRes = await client.query(
      `INSERT INTO academic_years (name, start_date, end_date, is_current)
       VALUES ('2025-2026', '2025-04-01', '2026-03-31', true)
       ON CONFLICT DO NOTHING
       RETURNING id`,
    );
    let academicYearId: string;
    if (ayRes.rows.length > 0) {
      academicYearId = ayRes.rows[0].id;
    } else {
      const ayFetch = await client.query(
        `SELECT id FROM academic_years WHERE name = '2025-2026' LIMIT 1`,
      );
      academicYearId = ayFetch.rows[0].id;
    }
    logger.log(`Academic year: ${academicYearId}`);

    // ─── 2. Terms ───
    const term1Res = await client.query(
      `INSERT INTO terms (academic_year_id, name, start_date, end_date, sort_order)
       VALUES ($1, 'Term 1', '2025-04-01', '2025-09-30', '1')
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [academicYearId],
    );
    let term1Id: string;
    if (term1Res.rows.length > 0) {
      term1Id = term1Res.rows[0].id;
    } else {
      const t1 = await client.query(
        `SELECT id FROM terms WHERE academic_year_id = $1 AND name = 'Term 1' LIMIT 1`,
        [academicYearId],
      );
      term1Id = t1.rows[0].id;
    }

    const term2Res = await client.query(
      `INSERT INTO terms (academic_year_id, name, start_date, end_date, sort_order)
       VALUES ($1, 'Term 2', '2025-10-01', '2026-03-31', '2')
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [academicYearId],
    );
    let term2Id: string;
    if (term2Res.rows.length > 0) {
      term2Id = term2Res.rows[0].id;
    } else {
      const t2 = await client.query(
        `SELECT id FROM terms WHERE academic_year_id = $1 AND name = 'Term 2' LIMIT 1`,
        [academicYearId],
      );
      term2Id = t2.rows[0].id;
    }
    logger.log(`Terms: ${term1Id}, ${term2Id}`);

    // ─── 3. Class & Section ───
    const classRes = await client.query(
      `INSERT INTO classes (name, numeric_order, academic_year_id, is_active)
       VALUES ('10', 12, $1, true)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [academicYearId],
    );
    let classId: string;
    if (classRes.rows.length > 0) {
      classId = classRes.rows[0].id;
    } else {
      const cFetch = await client.query(
        `SELECT id FROM classes WHERE name = '10' AND academic_year_id = $1 LIMIT 1`,
        [academicYearId],
      );
      classId = cFetch.rows[0].id;
    }

    const sectionRes = await client.query(
      `INSERT INTO sections (class_id, name, capacity, is_active)
       VALUES ($1, 'A', 40, true)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [classId],
    );
    let sectionId: string;
    if (sectionRes.rows.length > 0) {
      sectionId = sectionRes.rows[0].id;
    } else {
      const sFetch = await client.query(
        `SELECT id FROM sections WHERE class_id = $1 AND name = 'A' LIMIT 1`,
        [classId],
      );
      sectionId = sFetch.rows[0].id;
    }
    logger.log(`Class 10-A: ${classId} / ${sectionId}`);

    // ─── 4. Subjects ───
    const subjectNames = [
      { name: 'Mathematics', code: 'MATH' },
      { name: 'Science', code: 'SCI' },
      { name: 'English', code: 'ENG' },
      { name: 'Hindi', code: 'HIN' },
      { name: 'Social Science', code: 'SST' },
      { name: 'Computer Science', code: 'CS' },
    ];

    const subjectIds: string[] = [];
    for (const sub of subjectNames) {
      const subRes = await client.query(
        `INSERT INTO subjects (name, code, subject_type, is_active)
         VALUES ($1, $2, 'scholastic', true)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [sub.name, sub.code],
      );
      if (subRes.rows.length > 0) {
        subjectIds.push(subRes.rows[0].id);
      } else {
        const fetch = await client.query(`SELECT id FROM subjects WHERE code = $1 LIMIT 1`, [
          sub.code,
        ]);
        subjectIds.push(fetch.rows[0].id);
      }
    }
    logger.log(`Subjects seeded: ${subjectIds.length}`);

    // ─── 5. Class-Subject mapping ───
    for (const subId of subjectIds) {
      await client.query(
        `INSERT INTO class_subjects (class_id, subject_id, periods_per_week)
         VALUES ($1, $2, 5)
         ON CONFLICT DO NOTHING`,
        [classId, subId],
      );
    }

    // ─── 6. Student ───
    const studentRes = await client.query(
      `INSERT INTO students (
         admission_number, name, date_of_birth, gender, blood_group,
         category, religion, nationality, aadhaar_number,
         address, city, state, pincode,
         class_id, section_id, roll_number, admission_date, is_active
       ) VALUES (
         'ADM-2025-0001', 'Aarav Sharma', '2010-08-15', 'male', 'B+',
         'General', 'Hindu', 'Indian', '912345678901',
         '42, Rajendra Nagar, Sector 5', 'Jaipur', 'Rajasthan', '302019',
         $1, $2, 7, '2022-04-01', true
       ) RETURNING id`,
      [classId, sectionId],
    );
    const studentId = studentRes.rows[0].id;
    logger.log(`Student created: ${studentId} (Aarav Sharma)`);

    // ─── 7. Guardians — Father (primary) + Mother ───
    await client.query(
      `INSERT INTO student_guardians (student_id, name, relation, phone, email, occupation, address, is_primary)
       VALUES
         ($1, 'Vikram Sharma',  'father', '9414023456', 'vikram.sharma@gmail.com', 'Senior Manager, SBI',       '42, Rajendra Nagar, Sector 5, Jaipur', true),
         ($1, 'Priya Sharma',   'mother', '9414078912', 'priya.sharma@gmail.com',  'Assistant Professor, MNIT', '42, Rajendra Nagar, Sector 5, Jaipur', false)`,
      [studentId],
    );
    logger.log('Guardians seeded (father + mother)');

    // ─── 8. Class History ───
    await client.query(
      `INSERT INTO student_class_history (student_id, class_id, section_id, academic_year_id, roll_number, action, remarks)
       VALUES ($1, $2, $3, $4, 7, 'admitted', 'Admitted to Class 10-A for session 2025-26')`,
      [studentId, classId, sectionId, academicYearId],
    );
    logger.log('Class history seeded');

    // ─── 9. Fee Heads ───
    const feeHeadData = [
      { name: 'Tuition Fee', code: 'TUI', isRecurring: true, sort: 1 },
      { name: 'Annual Charges', code: 'ANN', isRecurring: false, sort: 2 },
      { name: 'Lab Fee', code: 'LAB', isRecurring: true, sort: 3 },
      { name: 'Computer Fee', code: 'CMP', isRecurring: true, sort: 4 },
      { name: 'Library Fee', code: 'LIB', isRecurring: true, sort: 5 },
      { name: 'Exam Fee', code: 'EXM', isRecurring: true, sort: 6 },
    ];

    const feeHeadIds: Record<string, string> = {};
    for (const fh of feeHeadData) {
      const fhRes = await client.query(
        `INSERT INTO fee_heads (name, code, is_recurring, is_active, sort_order)
         VALUES ($1, $2, $3, true, $4)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [fh.name, fh.code, fh.isRecurring, fh.sort],
      );
      if (fhRes.rows.length > 0) {
        feeHeadIds[fh.code] = fhRes.rows[0].id;
      } else {
        const fetch = await client.query(`SELECT id FROM fee_heads WHERE code = $1 LIMIT 1`, [
          fh.code,
        ]);
        feeHeadIds[fh.code] = fetch.rows[0].id;
      }
    }
    logger.log(`Fee heads seeded: ${Object.keys(feeHeadIds).length}`);

    // ─── 10. Fee Structures (amounts in paise) ───
    // Term 1 fees
    const structures = [
      { name: 'Tuition Fee - T1', code: 'TUI', amount: 1500000, term: term1Id, due: '2025-04-15' },
      { name: 'Annual Charges', code: 'ANN', amount: 500000, term: null, due: '2025-04-15' },
      { name: 'Lab Fee - T1', code: 'LAB', amount: 200000, term: term1Id, due: '2025-04-15' },
      { name: 'Computer Fee - T1', code: 'CMP', amount: 150000, term: term1Id, due: '2025-04-15' },
      { name: 'Library Fee - T1', code: 'LIB', amount: 100000, term: term1Id, due: '2025-04-15' },
      { name: 'Exam Fee - T1', code: 'EXM', amount: 100000, term: term1Id, due: '2025-08-01' },
      // Term 2 fees
      { name: 'Tuition Fee - T2', code: 'TUI', amount: 1500000, term: term2Id, due: '2025-10-15' },
      { name: 'Lab Fee - T2', code: 'LAB', amount: 200000, term: term2Id, due: '2025-10-15' },
      { name: 'Computer Fee - T2', code: 'CMP', amount: 150000, term: term2Id, due: '2025-10-15' },
      { name: 'Library Fee - T2', code: 'LIB', amount: 100000, term: term2Id, due: '2025-10-15' },
      { name: 'Exam Fee - T2', code: 'EXM', amount: 100000, term: term2Id, due: '2026-01-15' },
    ];

    const structureIds: {
      id: string;
      code: string;
      amount: number;
      term: string | null;
      due: string;
    }[] = [];
    for (const s of structures) {
      const sRes = await client.query(
        `INSERT INTO fee_structures (name, academic_year_id, class_id, fee_head_id, amount, due_date, term_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         RETURNING id`,
        [s.name, academicYearId, classId, feeHeadIds[s.code], s.amount, s.due, s.term],
      );
      structureIds.push({
        id: sRes.rows[0].id,
        code: s.code,
        amount: s.amount,
        term: s.term,
        due: s.due,
      });
    }
    logger.log(`Fee structures seeded: ${structureIds.length}`);

    // ─── 11. Student Fees ───
    // Term 1 fees — all paid; Term 2 — tuition partial, rest pending
    const adminUserRes = await client.query(
      `SELECT id FROM users WHERE role = 'school_admin' LIMIT 1`,
    );
    const adminUserId = adminUserRes.rows[0]?.id ?? null;

    const studentFeeRecords: {
      id: string;
      code: string;
      amount: number;
      paid: number;
      status: string;
      due: string;
    }[] = [];
    for (const s of structureIds) {
      let paidAmount = 0;
      let status = 'pending';

      // Term 1 fees — paid
      if (s.term === term1Id || s.term === null) {
        paidAmount = s.amount;
        status = 'paid';
      }
      // Term 2 Tuition — partial payment
      if (s.term === term2Id && s.code === 'TUI') {
        paidAmount = 750000; // ₹7,500 of ₹15,000
        status = 'partial';
      }

      const sfRes = await client.query(
        `INSERT INTO student_fees (student_id, fee_structure_id, original_amount, discount_amount, net_amount, paid_amount, status, due_date)
         VALUES ($1, $2, $3, 0, $3, $4, $5, $6)
         RETURNING id`,
        [studentId, s.id, s.amount, paidAmount, status, s.due],
      );
      studentFeeRecords.push({
        id: sfRes.rows[0].id,
        code: s.code,
        amount: s.amount,
        paid: paidAmount,
        status,
        due: s.due,
      });
    }
    logger.log(`Student fees assigned: ${studentFeeRecords.length}`);

    // ─── 12. Fee Payments ───
    let receiptNo = 1001;

    // Payment 1 — April 15: paid Annual + Tuition T1 + Lab T1 + Computer T1 + Library T1
    const april15Fees = studentFeeRecords.filter(
      (f) => f.status === 'paid' && f.due === '2025-04-15',
    );
    for (const sf of april15Fees) {
      await client.query(
        `INSERT INTO fee_payments (student_fee_id, student_id, amount, payment_mode, payment_date, receipt_number, remarks, collected_by)
         VALUES ($1, $2, $3, 'upi', '2025-04-15', $4, 'Paid via Google Pay', $5)`,
        [sf.id, studentId, sf.amount, `RCP-${receiptNo++}`, adminUserId],
      );
    }

    // Payment 2 — Aug 1: Exam Fee T1
    const examT1 = studentFeeRecords.find((f) => f.code === 'EXM' && f.due === '2025-08-01');
    if (examT1) {
      await client.query(
        `INSERT INTO fee_payments (student_fee_id, student_id, amount, payment_mode, payment_date, receipt_number, remarks, collected_by)
         VALUES ($1, $2, $3, 'cash', '2025-08-01', $4, 'Cash payment at office', $5)`,
        [examT1.id, studentId, examT1.amount, `RCP-${receiptNo++}`, adminUserId],
      );
    }

    // Payment 3 — Oct 20: Partial Tuition T2 (₹7,500)
    const tuitionT2 = studentFeeRecords.find((f) => f.code === 'TUI' && f.status === 'partial');
    if (tuitionT2) {
      await client.query(
        `INSERT INTO fee_payments (student_fee_id, student_id, amount, payment_mode, payment_date, receipt_number, remarks, collected_by)
         VALUES ($1, $2, $3, 'card', '2025-10-20', $4, 'Partial payment - card swipe', $5)`,
        [tuitionT2.id, studentId, 750000, `RCP-${receiptNo++}`, adminUserId],
      );
    }

    logger.log(`Fee payments seeded: ${receiptNo - 1001} receipts`);

    // ─── Done ───
    await client.query('SET search_path TO public');

    logger.log('');
    logger.log('=== Student Seed Complete ===');
    logger.log('');
    logger.log('  Student: Aarav Sharma (ADM-2025-0001)');
    logger.log('  Class:   10-A, Roll #7');
    logger.log('  DOB:     15 Aug 2010 | Blood: B+ | Category: General');
    logger.log('  Father:  Vikram Sharma — 9414023456 — vikram.sharma@gmail.com');
    logger.log('  Mother:  Priya Sharma  — 9414078912 — priya.sharma@gmail.com');
    logger.log('  Address: 42, Rajendra Nagar, Sector 5, Jaipur, Rajasthan 302019');
    logger.log('');
    logger.log('  Fees:');
    logger.log('    Term 1: Fully paid (₹25,500)');
    logger.log('    Term 2: ₹7,500 of ₹20,000 paid (Tuition partial, rest pending)');
    logger.log('    Total:  ₹33,000 / ₹45,500');
    logger.log('');
    logger.log('  Subjects: Math, Science, English, Hindi, SST, CS');
    logger.log('');
    logger.log('  NOTE: Attendance & Exams are Phase 3/5 — tables not yet created.');
    logger.log('        The student detail page shows placeholders for these.');
    logger.log('');
  } catch (error) {
    logger.error('Student seed failed:', error);
    throw error;
  } finally {
    client.release();
    await app.close();
  }
}

seedStudent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
