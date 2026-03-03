import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import type { StudentRow, GuardianRow } from './students.service';
import { FeesService } from '../fees/fees.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { SubscriptionGuard } from '../../common/guards/subscription.guard';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { TenantConnectionService } from '../../common/database/tenant-connection.service';
import { CurrentUser, Roles } from '../../common/decorators';

@Controller('school/students')
@UseGuards(TenantGuard, SubscriptionGuard, AuthGuard, RoleGuard)
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly feesService: FeesService,
    private readonly tc: TenantConnectionService,
  ) {}

  // =========================================
  // Student CRUD
  // =========================================

  @Get()
  @Roles('school_admin', 'vice_principal', 'teacher')
  findAll(
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.studentsService.findAll({
      classId,
      sectionId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('next-roll-number')
  @Roles('school_admin')
  async getNextRollNumber(
    @Query('classId') classId: string,
    @Query('sectionId') sectionId: string,
  ) {
    if (!classId || !sectionId) {
      throw new BadRequestException('classId and sectionId are required');
    }
    const rollNumber = await this.studentsService.nextRollNumber(classId, sectionId);
    return { rollNumber };
  }

  @Get(':id')
  @Roles('school_admin', 'vice_principal', 'teacher')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Post()
  @Roles('school_admin')
  create(
    @Body()
    body: {
      name: string;
      dateOfBirth: string;
      gender: string;
      bloodGroup?: string;
      category?: string;
      religion?: string;
      aadhaarNumber?: string;
      phone?: string;
      email?: string;
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
        whatsappNumber?: string;
      }>;
    },
  ) {
    return this.studentsService.create(body);
  }

  @Put(':id')
  @Roles('school_admin')
  update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      dateOfBirth: string;
      gender: string;
      bloodGroup: string;
      category: string;
      religion: string;
      aadhaarNumber: string;
      phone: string;
      email: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      classId: string;
      sectionId: string;
      rollNumber: number;
      isActive: boolean;
    }>,
  ) {
    return this.studentsService.update(id, body);
  }

  @Delete(':id')
  @Roles('school_admin')
  delete(@Param('id') id: string) {
    return this.studentsService.delete(id);
  }

  // =========================================
  // Guardians
  // =========================================

  @Post(':id/guardians')
  @Roles('school_admin')
  addGuardian(
    @Param('id') studentId: string,
    @Body()
    body: {
      name: string;
      relation: string;
      phone: string;
      email?: string;
      occupation?: string;
      address?: string;
      isPrimary?: boolean;
      whatsappNumber?: string;
    },
  ) {
    return this.studentsService.addGuardian(studentId, body);
  }

  // =========================================
  // Promotion
  // =========================================

  @Post(':id/promote')
  @Roles('school_admin')
  promote(
    @Param('id') studentId: string,
    @Body() body: { newClassId: string; newSectionId: string },
  ) {
    return this.studentsService.promoteStudent(studentId, body.newClassId, body.newSectionId);
  }

  // =========================================
  // Admission (complete flow)
  // =========================================

  @Post('admit')
  @Roles('school_admin')
  async admitStudent(
    @Body()
    body: {
      // Student details
      name: string;
      dateOfBirth: string;
      gender: string;
      bloodGroup?: string;
      category?: string;
      religion?: string;
      nationality?: string;
      aadhaarNumber?: string;
      phone?: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      classId: string;
      sectionId: string;
      rollNumber?: number;
      admissionDate?: string;
      // Guardians
      guardians: Array<{
        name: string;
        relation: string;
        phone: string;
        email?: string;
        occupation?: string;
        address?: string;
        isPrimary?: boolean;
        whatsappNumber?: string;
      }>;
      // Fee options
      assignFees?: boolean;
      academicYearId?: string;
      // Optional first payment
      payment?: {
        studentFeeId?: string; // set after assignment on client; or 'all' for full
        amount: number;
        paymentMode: string;
        transactionId?: string;
        remarks?: string;
      };
    },
    @CurrentUser() user: { id: string },
  ) {
    if (!body.guardians?.length) {
      throw new BadRequestException('At least one guardian is required for admission');
    }

    // Wrap entire admission in a transaction so it's all-or-nothing
    return this.tc.withTransaction(async () => {
      // 1. Create student + guardians + parent user accounts
      const student = await this.studentsService.create({
        name: body.name,
        dateOfBirth: body.dateOfBirth,
        gender: body.gender,
        bloodGroup: body.bloodGroup,
        category: body.category,
        religion: body.religion,
        aadhaarNumber: body.aadhaarNumber,
        phone: body.phone,
        email: body.email,
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        classId: body.classId,
        sectionId: body.sectionId,
        rollNumber: body.rollNumber,
        admissionDate: body.admissionDate,
        guardians: body.guardians,
      });

      // 2. Assign fees if requested
      let assignedFees: unknown[] = [];
      if (body.assignFees && body.academicYearId) {
        assignedFees = await this.feesService.assignFeesToStudent({
          studentId: student.id,
          classId: body.classId,
          academicYearId: body.academicYearId,
        });
      }

      // 3. Collect first payment if provided — distribute across all assigned fees
      let paymentReceipts: unknown[] = [];
      if (body.payment && assignedFees.length > 0 && body.payment.amount > 0) {
        let remaining = body.payment.amount;
        for (const fee of assignedFees as {
          id: string;
          net_amount: number;
          paid_amount: number;
        }[]) {
          if (remaining <= 0) break;
          const feeBalance = (fee.net_amount ?? 0) - (fee.paid_amount ?? 0);
          if (feeBalance <= 0) continue;
          const payAmount = Math.min(remaining, feeBalance);
          const receipt = await this.feesService.collectPayment(
            {
              studentFeeId: fee.id,
              amount: payAmount,
              paymentMode: body.payment.paymentMode,
              transactionId: body.payment.transactionId,
              remarks: body.payment.remarks ?? 'Admission fee payment',
            },
            user.id,
          );
          paymentReceipts.push(receipt);
          remaining -= payAmount;
        }
      }

      return {
        student,
        guardians: body.guardians.length,
        feesAssigned: assignedFees.length,
        payment:
          paymentReceipts.length === 1
            ? paymentReceipts[0]
            : paymentReceipts.length > 0
              ? paymentReceipts
              : null,
      };
    });
  }

  // =========================================
  // CSV Bulk Import
  // =========================================

  @Post('import/csv')
  @Roles('school_admin')
  async bulkImportCsv(
    @Body()
    body: {
      rows: Array<{
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
      }>;
    },
  ) {
    if (!body.rows?.length) {
      throw new BadRequestException('No rows provided');
    }
    return this.studentsService.bulkImportFromCsv(body.rows);
  }
}
