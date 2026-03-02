/** User roles within a school */
export type SchoolRole = 'school_admin' | 'vice_principal' | 'teacher' | 'accountant' | 'staff';

/** Parent/student portal roles */
export type PortalRole = 'parent' | 'student';

/** Gender options */
export type Gender = 'male' | 'female' | 'other';

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

/** Student record */
export interface Student {
  id: string;
  tenantId: string;
  admissionNumber: string;
  name: string;
  dateOfBirth: Date;
  gender: Gender;
  classId: string;
  sectionId: string;
  isActive: boolean;
}
