// =========================================
// Enums / Union types
// =========================================

/** User roles within a school */
export type SchoolRole = 'school_admin' | 'vice_principal' | 'teacher' | 'accountant' | 'staff';

/** Parent/student portal roles */
export type PortalRole = 'parent' | 'student';

/** Combined role type */
export type AllSchoolRole = SchoolRole | PortalRole;

/** Gender options */
export type Gender = 'male' | 'female' | 'other';

/** Subject categories */
export type SubjectType = 'scholastic' | 'co_scholastic';

/** Student class history actions */
export type StudentAction = 'admitted' | 'promoted' | 'transferred' | 'detained';

/** Guardian relations */
export type GuardianRelation = 'father' | 'mother' | 'guardian';

// =========================================
// School Profile
// =========================================

export interface SchoolProfile {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  board: string;
  udiseCode?: string;
  affiliationNumber?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  website?: string;
}

// =========================================
// Academic Year & Terms
// =========================================

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Term {
  id: string;
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
  sortOrder: string;
}

// =========================================
// Users & RBAC
// =========================================

/** School user record */
export interface SchoolUser {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  role: SchoolRole;
  isActive: boolean;
  createdAt: Date;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
}

export interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  description?: string;
}

// =========================================
// Classes & Subjects
// =========================================

export interface Class {
  id: string;
  name: string;
  numericOrder: number;
  academicYearId: string;
  classTeacherId?: string;
  isActive: boolean;
  sections?: Section[];
}

export interface Section {
  id: string;
  classId: string;
  name: string;
  capacity?: number;
  isActive: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  subjectType: SubjectType;
  isActive: boolean;
}

export interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  teacherId?: string;
  periodsPerWeek?: number;
}

// =========================================
// Students
// =========================================

/** Student record */
export interface Student {
  id: string;
  tenantId: string;
  admissionNumber: string;
  name: string;
  dateOfBirth: Date;
  gender: Gender;
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
  isActive: boolean;
  photoUrl?: string;
  guardians?: StudentGuardian[];
}

export interface StudentGuardian {
  id: string;
  studentId: string;
  name: string;
  relation: GuardianRelation;
  phone: string;
  email?: string;
  occupation?: string;
  address?: string;
  isPrimary: boolean;
  userId?: string;
}

export interface StudentClassHistory {
  id: string;
  studentId: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
  rollNumber?: number;
  action: StudentAction;
  remarks?: string;
  createdAt: Date;
}

// =========================================
// Teachers
// =========================================

export interface Teacher {
  id: string;
  userId: string;
  employeeId?: string;
  qualification?: string;
  specialization?: string;
  experienceYears?: number;
  dateOfJoining?: string;
  designation?: string;
  isClassTeacher: boolean;
  bio?: string;
  /** Joined from users table */
  name?: string;
  phone?: string;
  email?: string;
}

export interface TeacherSubject {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  sectionId?: string;
}
