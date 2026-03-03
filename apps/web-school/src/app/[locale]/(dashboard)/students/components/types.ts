export interface StudentDetail {
  id: string;
  admissionNumber: string;
  name: string;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  category: string | null;
  religion: string | null;
  aadhaarNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  classId: string | null;
  sectionId: string | null;
  className: string | null;
  sectionName: string | null;
  rollNumber: string | null;
  admissionDate: string | null;
  isActive: boolean;
  photoUrl: string | null;
  createdAt: string;
  guardians: Guardian[];
}

export interface Guardian {
  id: string;
  studentId: string;
  name: string;
  relation: string;
  phone: string | null;
  email: string | null;
  occupation: string | null;
  address: string | null;
  whatsappNumber: string | null;
  isPrimary: boolean;
  userId: string | null;
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
  feeHeadName?: string;
  collectedByName?: string;
}

export interface FeeSummary {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
}

export type ApiCall = (path: string, opts?: RequestInit) => Promise<unknown>;

export type TabKey = 'overview' | 'fees' | 'attendance' | 'grades';
