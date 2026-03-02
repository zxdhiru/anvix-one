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
import { TenantGuard } from '../../common/guards/tenant.guard';
import { SubscriptionGuard } from '../../common/guards/subscription.guard';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators';

@Controller('school/students')
@UseGuards(TenantGuard, SubscriptionGuard, AuthGuard, RoleGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

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
