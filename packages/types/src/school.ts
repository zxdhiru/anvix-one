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
  whatsappNumber?: string;
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

// =========================================
// Fee Management
// =========================================

/** Fee payment status */
export type FeeStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'waived';

/** Payment mode */
export type PaymentMode = 'cash' | 'upi' | 'card' | 'netbanking' | 'cheque' | 'dd';

/** Discount type */
export type DiscountType = 'percentage' | 'fixed';

/** Discount applicability */
export type DiscountApplicableTo = 'all' | 'category' | 'individual';

export interface FeeHead {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isRecurring: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface FeeStructure {
  id: string;
  name: string;
  academicYearId: string;
  classId: string;
  feeHeadId: string;
  amount: number;
  dueDate?: string;
  termId?: string;
  isActive: boolean;
  /** Joined */
  feeHeadName?: string;
  className?: string;
  termName?: string;
}

export interface FeeDiscount {
  id: string;
  name: string;
  discountType: DiscountType;
  value: number;
  applicableTo: DiscountApplicableTo;
  category?: string;
  description?: string;
  isActive: boolean;
}

export interface StudentFee {
  id: string;
  studentId: string;
  feeStructureId: string;
  discountId?: string;
  originalAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  status: FeeStatus;
  dueDate?: string;
  /** Joined */
  studentName?: string;
  admissionNumber?: string;
  className?: string;
  feeHeadName?: string;
}

export interface FeePayment {
  id: string;
  studentFeeId: string;
  studentId: string;
  amount: number;
  paymentMode: PaymentMode;
  paymentDate: string;
  transactionId?: string;
  razorpayPaymentId?: string;
  receiptNumber?: string;
  remarks?: string;
  collectedBy?: string;
  /** Joined */
  studentName?: string;
  feeHeadName?: string;
  collectedByName?: string;
}
