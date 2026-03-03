import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { FeesService } from './fees.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { SubscriptionGuard } from '../../common/guards/subscription.guard';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { CurrentUser, Roles } from '../../common/decorators';

@Controller('school/fees')
@UseGuards(TenantGuard, SubscriptionGuard, AuthGuard, RoleGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  // =========================================
  // Fee Heads
  // =========================================

  @Get('heads')
  @Roles('school_admin', 'accountant')
  findAllFeeHeads() {
    return this.feesService.findAllFeeHeads();
  }

  @Post('heads')
  @Roles('school_admin', 'accountant')
  createFeeHead(
    @Body()
    body: {
      name: string;
      code?: string;
      description?: string;
      isRecurring?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.feesService.createFeeHead(body);
  }

  @Put('heads/:id')
  @Roles('school_admin', 'accountant')
  updateFeeHead(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      code: string;
      description: string;
      isRecurring: boolean;
      isActive: boolean;
      sortOrder: number;
    }>,
  ) {
    return this.feesService.updateFeeHead(id, body);
  }

  @Delete('heads/:id')
  @Roles('school_admin')
  deleteFeeHead(@Param('id') id: string) {
    return this.feesService.deleteFeeHead(id);
  }

  // =========================================
  // Fee Structures
  // =========================================

  @Get('structures')
  @Roles('school_admin', 'accountant')
  findAllFeeStructures(
    @Query('academicYearId') academicYearId?: string,
    @Query('classId') classId?: string,
  ) {
    return this.feesService.findAllFeeStructures({ academicYearId, classId });
  }

  @Post('structures')
  @Roles('school_admin', 'accountant')
  createFeeStructure(
    @Body()
    body: {
      name: string;
      academicYearId: string;
      classId: string;
      feeHeadId: string;
      amount: number;
      dueDate?: string;
      termId?: string;
    },
  ) {
    return this.feesService.createFeeStructure(body);
  }

  @Put('structures/:id')
  @Roles('school_admin', 'accountant')
  updateFeeStructure(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      amount: number;
      dueDate: string;
      isActive: boolean;
    }>,
  ) {
    return this.feesService.updateFeeStructure(id, body);
  }

  @Delete('structures/:id')
  @Roles('school_admin')
  deleteFeeStructure(@Param('id') id: string) {
    return this.feesService.deleteFeeStructure(id);
  }

  // =========================================
  // Fee Discounts
  // =========================================

  @Get('discounts')
  @Roles('school_admin', 'accountant')
  findAllDiscounts() {
    return this.feesService.findAllDiscounts();
  }

  @Post('discounts')
  @Roles('school_admin', 'accountant')
  createDiscount(
    @Body()
    body: {
      name: string;
      discountType: 'percentage' | 'fixed';
      value: number;
      applicableTo?: 'all' | 'category' | 'individual';
      category?: string;
      description?: string;
    },
  ) {
    return this.feesService.createDiscount(body);
  }

  @Put('discounts/:id')
  @Roles('school_admin', 'accountant')
  updateDiscount(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      discountType: string;
      value: number;
      applicableTo: string;
      category: string;
      description: string;
      isActive: boolean;
    }>,
  ) {
    return this.feesService.updateDiscount(id, body);
  }

  // =========================================
  // Student Fees
  // =========================================

  @Get('student-fees')
  @Roles('school_admin', 'accountant', 'teacher')
  findStudentFees(
    @Query('studentId') studentId?: string,
    @Query('classId') classId?: string,
    @Query('status') status?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.feesService.findStudentFees({
      studentId,
      classId,
      status,
      academicYearId,
    });
  }

  @Post('assign')
  @Roles('school_admin', 'accountant')
  assignFeesToClass(
    @Body()
    body: {
      classId: string;
      academicYearId: string;
      feeStructureIds?: string[];
    },
  ) {
    return this.feesService.assignFeesToClass(body);
  }

  @Post('student-fees/:id/discount')
  @Roles('school_admin', 'accountant')
  applyDiscount(@Param('id') studentFeeId: string, @Body() body: { discountId: string }) {
    return this.feesService.applyDiscount(studentFeeId, body.discountId);
  }

  @Post('student-fees/:id/waive')
  @Roles('school_admin')
  waiveStudentFee(@Param('id') studentFeeId: string) {
    return this.feesService.waiveStudentFee(studentFeeId);
  }

  // =========================================
  // Payments
  // =========================================

  @Get('payments')
  @Roles('school_admin', 'accountant')
  findPayments(
    @Query('studentId') studentId?: string,
    @Query('studentFeeId') studentFeeId?: string,
  ) {
    return this.feesService.findPayments({ studentId, studentFeeId });
  }

  @Post('payments/collect')
  @Roles('school_admin', 'accountant')
  collectPayment(
    @Body()
    body: {
      studentFeeId: string;
      amount: number;
      paymentMode: string;
      paymentDate?: string;
      transactionId?: string;
      remarks?: string;
    },
    @CurrentUser() user: { id: string },
  ) {
    return this.feesService.collectPayment(body, user.id);
  }

  // =========================================
  // Reports & Summary
  // =========================================

  @Get('summary')
  @Roles('school_admin', 'accountant')
  getFeeSummary(@Query('academicYearId') academicYearId?: string) {
    return this.feesService.getFeeSummary(academicYearId);
  }

  @Get('summary/class-wise')
  @Roles('school_admin', 'accountant')
  getClassWiseSummary(@Query('academicYearId') academicYearId: string) {
    return this.feesService.getClassWiseSummary(academicYearId);
  }

  @Post('overdue/mark')
  @Roles('school_admin', 'accountant')
  markOverdueFees() {
    return this.feesService.markOverdueFees();
  }
}
