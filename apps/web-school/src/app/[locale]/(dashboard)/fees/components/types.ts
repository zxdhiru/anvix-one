export interface FeeHead {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
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
  dueDate: string | null;
  termId: string | null;
  isActive: boolean;
  feeHeadName?: string;
  className?: string;
  termName?: string;
}

export interface StudentFee {
  id: string;
  studentId: string;
  feeStructureId: string;
  discountId: string | null;
  originalAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  status: string;
  dueDate: string | null;
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
  paymentMode: string;
  paymentDate: string;
  transactionId: string | null;
  receiptNumber: string | null;
  remarks: string | null;
  studentName?: string;
  feeHeadName?: string;
  collectedByName?: string;
}

export interface FeeSummary {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  studentCount: number;
  paidCount: number;
  partialCount: number;
  overdueCount: number;
}

export interface ClassItem {
  id: string;
  name: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

export interface Term {
  id: string;
  name: string;
  academicYearId: string;
}

export type ApiCall = (path: string, opts?: RequestInit) => Promise<unknown>;

export const TABS = [
  { key: 'overview', label: 'Overview', icon: 'BarChart3' },
  { key: 'heads', label: 'Fee Heads', icon: 'FileText' },
  { key: 'structures', label: 'Structures', icon: 'IndianRupee' },
  { key: 'student-fees', label: 'Student Fees', icon: 'Users' },
  { key: 'collect', label: 'Collect', icon: 'Banknote' },
  { key: 'payments', label: 'Payments', icon: 'Receipt' },
] as const;

export type TabKey = (typeof TABS)[number]['key'];
