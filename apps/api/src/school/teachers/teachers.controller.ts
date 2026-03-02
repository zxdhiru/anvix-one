import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import type { TeacherRow, TeacherWithUser, TeacherSubjectRow } from './teachers.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { SubscriptionGuard } from '../../common/guards/subscription.guard';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators';

@Controller('school/teachers')
@UseGuards(TenantGuard, SubscriptionGuard, AuthGuard, RoleGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @Roles('school_admin', 'vice_principal')
  findAll(@Query('isActive') isActive?: string) {
    return this.teachersService.findAll({
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  @Roles('school_admin', 'vice_principal', 'teacher')
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Post()
  @Roles('school_admin')
  create(
    @Body()
    body: {
      name: string;
      phone: string;
      email?: string;
      employeeId: string;
      qualification?: string;
      specialization?: string;
      experienceYears?: number;
      designation?: string;
    },
  ) {
    return this.teachersService.create(body);
  }

  @Put(':id')
  @Roles('school_admin')
  update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      qualification: string;
      specialization: string;
      experienceYears: number;
      designation: string;
      isActive: boolean;
    }>,
  ) {
    return this.teachersService.update(id, body);
  }

  @Delete(':id')
  @Roles('school_admin')
  delete(@Param('id') id: string) {
    return this.teachersService.delete(id);
  }

  // Subject assignments
  @Get(':id/subjects')
  @Roles('school_admin', 'vice_principal', 'teacher')
  getSubjects(@Param('id') teacherId: string) {
    return this.teachersService.getTeacherSubjects(teacherId);
  }

  @Post(':id/subjects')
  @Roles('school_admin')
  assignSubject(
    @Param('id') teacherId: string,
    @Body() body: { subjectId: string; classId: string; sectionId?: string },
  ) {
    return this.teachersService.assignSubject(
      teacherId,
      body.subjectId,
      body.classId,
      body.sectionId,
    );
  }

  @Delete('subject-assignments/:assignmentId')
  @Roles('school_admin')
  removeSubjectAssignment(@Param('assignmentId') assignmentId: string) {
    return this.teachersService.removeSubjectAssignment(assignmentId);
  }
}
