import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { SubscriptionGuard } from '../../common/guards/subscription.guard';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AcademicsService } from './academics.service';
import type {
  SchoolProfileRow,
  AcademicYearRow,
  TermRow,
  ClassRow,
  SectionRow,
  SubjectRow,
  ClassSubjectRow,
} from './academics.service';

@Controller('school/academics')
@UseGuards(TenantGuard, SubscriptionGuard, AuthGuard, RoleGuard)
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}

  // =========================================
  // School Profile
  // =========================================

  @Get('profile')
  getProfile() {
    return this.academicsService.getSchoolProfile();
  }

  @Put('profile')
  @Roles('school_admin')
  updateProfile(@Body() body: Record<string, unknown>) {
    return this.academicsService.updateSchoolProfile(body as never);
  }

  // =========================================
  // Academic Years
  // =========================================

  @Get('years')
  getAcademicYears() {
    return this.academicsService.getAcademicYears();
  }

  @Get('years/current')
  getCurrentAcademicYear() {
    return this.academicsService.getCurrentAcademicYear();
  }

  @Post('years')
  @Roles('school_admin')
  createAcademicYear(
    @Body() body: { name: string; startDate: string; endDate: string; isCurrent?: boolean },
  ) {
    return this.academicsService.createAcademicYear(body);
  }

  // =========================================
  // Terms
  // =========================================

  @Get('terms')
  getTerms(@Query('academicYearId') academicYearId: string) {
    return this.academicsService.getTerms(academicYearId);
  }

  @Post('terms')
  @Roles('school_admin')
  createTerm(
    @Body()
    body: {
      academicYearId: string;
      name: string;
      startDate: string;
      endDate: string;
      sortOrder?: string;
    },
  ) {
    return this.academicsService.createTerm(body);
  }

  // =========================================
  // Classes
  // =========================================

  @Get('classes')
  getClasses(@Query('academicYearId') academicYearId?: string) {
    return this.academicsService.getClasses(academicYearId);
  }

  @Post('classes')
  @Roles('school_admin')
  createClass(
    @Body()
    body: {
      name: string;
      numericOrder: number;
      academicYearId: string;
      classTeacherId?: string;
    },
  ) {
    return this.academicsService.createClass(body);
  }

  @Post('classes/seed')
  @Roles('school_admin')
  seedDefaultClasses(@Body() body: { academicYearId: string }) {
    return this.academicsService.seedDefaultClasses(body.academicYearId);
  }

  // =========================================
  // Sections
  // =========================================

  @Get('classes/:classId/sections')
  getSections(@Param('classId') classId: string) {
    return this.academicsService.getSections(classId);
  }

  @Post('sections')
  @Roles('school_admin')
  createSection(@Body() body: { classId: string; name: string; capacity?: number }) {
    return this.academicsService.createSection(body);
  }

  // =========================================
  // Subjects
  // =========================================

  @Get('subjects')
  getSubjects() {
    return this.academicsService.getSubjects();
  }

  @Post('subjects')
  @Roles('school_admin')
  createSubject(@Body() body: { name: string; code?: string; subjectType?: string }) {
    return this.academicsService.createSubject(body);
  }

  @Post('subjects/seed')
  @Roles('school_admin')
  seedDefaultSubjects(@Body() body: { board: string }) {
    return this.academicsService.seedDefaultSubjects(body.board);
  }

  // =========================================
  // Class-Subject mapping
  // =========================================

  @Get('classes/:classId/subjects')
  getClassSubjects(@Param('classId') classId: string) {
    return this.academicsService.getClassSubjects(classId);
  }

  @Post('class-subjects')
  @Roles('school_admin')
  assignClassSubject(
    @Body()
    body: {
      classId: string;
      subjectId: string;
      teacherId?: string;
      periodsPerWeek?: number;
    },
  ) {
    return this.academicsService.assignClassSubject(body);
  }
}
