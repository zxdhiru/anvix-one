'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Button } from '@anvix/ui/components/ui/button';
import { Input } from '@anvix/ui/components/ui/input';
import { Label } from '@anvix/ui/components/ui/label';
import { Badge } from '@anvix/ui/components/ui/badge';
import { Card, CardContent } from '@anvix/ui/components/ui/card';
import { Separator } from '@anvix/ui/components/ui/separator';
import { Textarea } from '@anvix/ui/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@anvix/ui/components/ui/select';
import {
  UserPlus,
  User,
  GraduationCap,
  Users,
  IndianRupee,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Phone,
  Mail,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
} from 'lucide-react';

/* ============================================================
   Types
   ============================================================ */

interface ClassItem {
  id: string;
  name: string;
  sections?: { id: string; name: string }[];
}
interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}
interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  feeHeadName?: string;
  dueDate?: string | null;
}
interface Guardian {
  name: string;
  relation: string;
  phone: string;
  email: string;
  occupation: string;
  address: string;
  isPrimary: boolean;
  whatsappNumber: string;
}
interface AdmissionResult {
  student: {
    id: string;
    admissionNumber: string;
    name: string;
    classId: string;
  };
  guardians: number;
  feesAssigned: number;
  payment: {
    receiptNumber: string;
    amount: number;
    paymentMode: string;
  } | null;
}

/* ============================================================
   Constants
   ============================================================ */

const STEPS = [
  { key: 'student', label: 'Student', icon: User },
  { key: 'class', label: 'Class', icon: GraduationCap },
  { key: 'guardians', label: 'Guardians', icon: Users },
  { key: 'fees', label: 'Fees', icon: IndianRupee },
  { key: 'review', label: 'Review', icon: ClipboardCheck },
] as const;

const RELATIONS = [
  'father',
  'mother',
  'grandfather',
  'grandmother',
  'uncle',
  'aunt',
  'sibling',
  'guardian',
] as const;
const GENDERS = ['male', 'female', 'other'] as const;
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS'] as const;
const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'netbanking', label: 'Net Banking', icon: FileText },
  { value: 'cheque', label: 'Cheque', icon: Receipt },
] as const;

function emptyGuardian(isPrimary = false): Guardian {
  return {
    name: '',
    relation: 'father',
    phone: '',
    email: '',
    occupation: '',
    address: '',
    isPrimary,
    whatsappNumber: '',
  };
}

function fmt(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

/* ============================================================
   Main Page
   ============================================================ */

export default function AdmissionPage() {
  const { token, tenantSlug } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AdmissionResult | null>(null);
  const [error, setError] = useState('');

  // Reference data
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loadingFees, setLoadingFees] = useState(false);

  // Student form
  const [student, setStudent] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'male',
    bloodGroup: '',
    category: '',
    religion: '',
    nationality: 'Indian',
    aadhaarNumber: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Class form
  const [classForm, setClassForm] = useState({
    classId: '',
    sectionId: '',
    rollNumber: '',
    admissionDate: new Date().toISOString().split('T')[0],
  });

  // Guardians
  const [guardians, setGuardians] = useState<Guardian[]>([emptyGuardian(true)]);

  // Fee & payment
  const [assignFees, setAssignFees] = useState(true);
  const [collectPayment, setCollectPayment] = useState(false);
  const [payment, setPayment] = useState({
    amount: '',
    paymentMode: 'cash',
    transactionId: '',
    remarks: '',
  });

  const api = useCallback(
    (path: string, opts: RequestInit = {}) =>
      apiClient(path, {
        ...opts,
        tenantSlug: tenantSlug ?? undefined,
        token: token ?? undefined,
      }),
    [tenantSlug, token],
  );

  // Load reference data
  useEffect(() => {
    Promise.all([
      api('/school/academics/classes').catch(() => []),
      api('/school/academics/years').catch(() => []),
    ]).then(async ([classData, yearData]) => {
      const classesArr = Array.isArray(classData) ? classData : [];
      const yearsArr = Array.isArray(yearData) ? yearData : [];
      // Fetch sections per class
      const enriched = await Promise.all(
        classesArr.map(async (cls: ClassItem) => {
          const secs = await api(`/school/academics/classes/${cls.id}/sections`).catch(() => []);
          return { ...cls, sections: Array.isArray(secs) ? secs : [] };
        }),
      );
      setClasses(enriched);
      setAcademicYears(yearsArr);
    });
  }, [api]);

  // Load fee structures when class changes
  useEffect(() => {
    if (!classForm.classId) {
      setFeeStructures([]);
      return;
    }
    const curYear = academicYears.find((y) => y.isCurrent);
    if (!curYear) return;

    setLoadingFees(true);
    api(`/school/fees/structures?classId=${classForm.classId}&academicYearId=${curYear.id}`)
      .then((data) => setFeeStructures(Array.isArray(data) ? data : []))
      .catch(() => setFeeStructures([]))
      .finally(() => setLoadingFees(false));
  }, [classForm.classId, academicYears, api]);

  // Auto-assign next roll number when class + section selected
  useEffect(() => {
    if (!classForm.classId || !classForm.sectionId) return;
    api(
      `/school/students/next-roll-number?classId=${classForm.classId}&sectionId=${classForm.sectionId}`,
    )
      .then((data) => {
        const nr = (data as { rollNumber: number })?.rollNumber;
        if (nr) setClassForm((prev) => ({ ...prev, rollNumber: String(nr) }));
      })
      .catch(() => {});
  }, [classForm.classId, classForm.sectionId, api]);

  const curYear = academicYears.find((y) => y.isCurrent);
  const selectedClass = classes.find((c) => c.id === classForm.classId);
  const selectedSection = selectedClass?.sections?.find((s) => s.id === classForm.sectionId);
  const totalFees = feeStructures.reduce((sum, f) => sum + f.amount, 0);

  /* ---- Validation ---- */
  function canProceed(): boolean {
    switch (step) {
      case 0:
        return !!student.name && !!student.dateOfBirth && !!student.gender;
      case 1:
        return !!classForm.classId && !!classForm.sectionId;
      case 2:
        return guardians.length > 0 && guardians.every((g) => g.name && g.phone && g.relation);
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  }

  /* ---- Submit ---- */
  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        ...student,
        classId: classForm.classId,
        sectionId: classForm.sectionId,
        rollNumber: classForm.rollNumber ? Number(classForm.rollNumber) : undefined,
        admissionDate: classForm.admissionDate || undefined,
        guardians,
        assignFees,
        academicYearId: curYear?.id,
      };

      if (collectPayment && payment.amount) {
        body.payment = {
          amount: Math.round(parseFloat(payment.amount) * 100),
          paymentMode: payment.paymentMode,
          transactionId: payment.transactionId || undefined,
          remarks: payment.remarks || undefined,
        };
      }

      const res = (await api('/school/students/admit', {
        method: 'POST',
        body: JSON.stringify(body),
      })) as AdmissionResult;

      setResult(res);
      setStep(5); // success screen
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admission failed');
    } finally {
      setSubmitting(false);
    }
  }

  /* ---- Success Screen ---- */
  if (step === 5 && result) {
    return (
      <div className="mx-auto max-w-2xl page-fade-in space-y-6 py-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60">
              <CheckCircle2 className="size-10 text-emerald-600" />
            </div>
            <div className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60">
              <Sparkles className="size-4 text-amber-600" />
            </div>
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">Admission Successful!</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {result.student.name} has been enrolled with admission number
          </p>
          <Badge variant="secondary" className="mt-2 px-3 py-1.5 font-mono text-sm tracking-wider">
            {result.student.admissionNumber}
          </Badge>
        </div>

        <Card>
          <CardContent className="divide-y pt-4">
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs text-muted-foreground">Guardian accounts</span>
              <span className="text-sm font-medium">{result.guardians} created</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-xs text-muted-foreground">Fees assigned</span>
              <span className="text-sm font-medium">{result.feesAssigned} fee(s)</span>
            </div>
            {result.payment && (
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs text-muted-foreground">Payment receipt</span>
                <div className="text-right">
                  <p className="font-mono text-sm font-medium text-emerald-600">
                    {result.payment.receiptNumber}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {fmt(result.payment.amount)} via {result.payment.paymentMode}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              // Reset everything
              setStep(0);
              setResult(null);
              setStudent({
                name: '',
                dateOfBirth: '',
                gender: 'male',
                bloodGroup: '',
                category: '',
                religion: '',
                nationality: 'Indian',
                aadhaarNumber: '',
                phone: '',
                email: '',
                address: '',
                city: '',
                state: '',
                pincode: '',
              });
              setClassForm({
                classId: '',
                sectionId: '',
                rollNumber: '',
                admissionDate: new Date().toISOString().split('T')[0],
              });
              setGuardians([emptyGuardian(true)]);
              setPayment({ amount: '', paymentMode: 'cash', transactionId: '', remarks: '' });
              setCollectPayment(false);
            }}
          >
            <UserPlus className="mr-1.5 size-4" />
            Admit Another
          </Button>
          <Button className="flex-1" onClick={() => router.push('/students')}>
            View Students
          </Button>
        </div>
      </div>
    );
  }

  /* ============================================================
     Render
     ============================================================ */

  return (
    <div className="page-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">New Admission</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Complete each step to enroll a new student
        </p>
      </div>

      {/* Step indicator */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <button
                key={s.key}
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className="group relative z-10 flex flex-col items-center gap-1.5"
              >
                <div
                  className={`flex size-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isDone
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : isActive
                        ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'border-muted-foreground/20 bg-muted text-muted-foreground'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="size-5" /> : <Icon className="size-4" />}
                </div>
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive
                      ? 'text-foreground'
                      : isDone
                        ? 'text-emerald-600'
                        : 'text-muted-foreground'
                  }`}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
        {/* Connecting line */}
        <div className="absolute left-[10%] right-[10%] top-5 z-0 h-0.5 bg-muted-foreground/10">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          {step === 0 && <StudentStep student={student} onChange={setStudent} />}
          {step === 1 && <ClassStep form={classForm} onChange={setClassForm} classes={classes} />}
          {step === 2 && <GuardianStep guardians={guardians} onChange={setGuardians} />}
          {step === 3 && (
            <FeeStep
              feeStructures={feeStructures}
              totalFees={totalFees}
              loadingFees={loadingFees}
              assignFees={assignFees}
              onAssignFeesChange={setAssignFees}
              collectPayment={collectPayment}
              onCollectPaymentChange={setCollectPayment}
              payment={payment}
              onPaymentChange={setPayment}
              className={selectedClass?.name}
            />
          )}
          {step === 4 && (
            <ReviewStep
              student={student}
              classForm={classForm}
              selectedClass={selectedClass}
              selectedSection={selectedSection}
              guardians={guardians}
              feeStructures={feeStructures}
              totalFees={totalFees}
              assignFees={assignFees}
              collectPayment={collectPayment}
              payment={payment}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="gap-1.5"
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>

        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-1.5">
            Next
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting || !canProceed()}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" /> Confirm Admission
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Step 1: Student Details
   ============================================================ */

type StudentForm = {
  name: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  category: string;
  religion: string;
  nationality: string;
  aadhaarNumber: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

function StudentStep({
  student,
  onChange,
}: {
  student: StudentForm;
  onChange: (v: StudentForm) => void;
}) {
  const set = (key: keyof StudentForm, val: string) => onChange({ ...student, [key]: val });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold">Personal Information</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Enter the student&apos;s basic details
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            value={student.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Enter student's full name"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">
            Date of Birth <span className="text-destructive">*</span>
          </Label>
          <Input
            type="date"
            value={student.dateOfBirth}
            onChange={(e) => set('dateOfBirth', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">
            Gender <span className="text-destructive">*</span>
          </Label>
          <Select value={student.gender} onValueChange={(v) => set('gender', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GENDERS.map((g) => (
                <SelectItem key={g} value={g} className="capitalize">
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Blood Group</Label>
          <Select value={student.bloodGroup} onValueChange={(v) => set('bloodGroup', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {BLOOD_GROUPS.map((bg) => (
                <SelectItem key={bg} value={bg}>
                  {bg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Category</Label>
          <Select value={student.category} onValueChange={(v) => set('category', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Religion</Label>
          <Input
            value={student.religion}
            onChange={(e) => set('religion', e.target.value)}
            placeholder="e.g. Hindu, Muslim, Christian"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Nationality</Label>
          <Input value={student.nationality} onChange={(e) => set('nationality', e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Aadhaar Number</Label>
          <Input
            value={student.aadhaarNumber}
            onChange={(e) => set('aadhaarNumber', e.target.value.replace(/\D/g, '').slice(0, 12))}
            placeholder="12-digit Aadhaar"
            maxLength={12}
          />
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-sm font-semibold">Contact</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Student&apos;s phone number and email address
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={student.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="9876543210"
              className="pl-8"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Email</Label>
          <div className="relative">
            <Mail className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              value={student.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="student@email.com"
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-sm font-semibold">Address</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Student&apos;s residential address</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">Street Address</Label>
          <Textarea
            value={student.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="House no, street, locality"
            rows={2}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">City</Label>
          <Input
            value={student.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="City"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">State</Label>
          <Input
            value={student.state}
            onChange={(e) => set('state', e.target.value)}
            placeholder="State"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">PIN Code</Label>
          <Input
            value={student.pincode}
            onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit PIN"
            maxLength={6}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Step 2: Class Assignment
   ============================================================ */

function ClassStep({
  form,
  onChange,
  classes,
}: {
  form: { classId: string; sectionId: string; rollNumber: string; admissionDate: string };
  onChange: (v: typeof form) => void;
  classes: ClassItem[];
}) {
  const selectedClass = classes.find((c) => c.id === form.classId);
  const sections = selectedClass?.sections ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold">Class Assignment</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Assign the student to a class and section
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">
            Class <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.classId}
            onValueChange={(v) => onChange({ ...form, classId: v, sectionId: '' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">
            Section <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.sectionId}
            onValueChange={(v) => onChange({ ...form, sectionId: v })}
            disabled={!form.classId}
          >
            <SelectTrigger>
              <SelectValue placeholder={form.classId ? 'Select section' : 'Select class first'} />
            </SelectTrigger>
            <SelectContent>
              {sections.map((sec) => (
                <SelectItem key={sec.id} value={sec.id}>
                  {sec.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Roll Number</Label>
          <Input
            type="number"
            value={form.rollNumber}
            onChange={(e) => onChange({ ...form, rollNumber: e.target.value })}
            placeholder="Auto-assigned"
            min={1}
          />
          {form.rollNumber && (
            <p className="text-[10px] text-muted-foreground">Auto-assigned — you can change it</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Admission Date</Label>
          <Input
            type="date"
            value={form.admissionDate}
            onChange={(e) => onChange({ ...form, admissionDate: e.target.value })}
          />
        </div>
      </div>

      {selectedClass && (
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
          <p className="text-xs font-medium text-primary">
            Enrolling into {selectedClass.name}
            {sections.find((s) => s.id === form.sectionId)?.name
              ? ` — Section ${sections.find((s) => s.id === form.sectionId)?.name}`
              : ''}
          </p>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Step 3: Guardian Details
   ============================================================ */

function GuardianStep({
  guardians,
  onChange,
}: {
  guardians: Guardian[];
  onChange: (v: Guardian[]) => void;
}) {
  function updateGuardian(index: number, key: keyof Guardian, value: string | boolean) {
    const updated = [...guardians];
    updated[index] = { ...updated[index], [key]: value };
    onChange(updated);
  }

  function addGuardian() {
    onChange([...guardians, emptyGuardian()]);
  }

  function removeGuardian(index: number) {
    if (guardians.length <= 1) return;
    const updated = guardians.filter((_, i) => i !== index);
    // Ensure at least one is primary
    if (!updated.some((g) => g.isPrimary)) updated[0].isPrimary = true;
    onChange(updated);
  }

  function setPrimary(index: number) {
    const updated = guardians.map((g, i) => ({ ...g, isPrimary: i === index }));
    onChange(updated);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Guardian Information</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Add parents or guardians. A login account will be auto-created for each.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addGuardian} className="gap-1.5 text-xs">
          <Plus className="size-3.5" /> Add Guardian
        </Button>
      </div>

      <div className="space-y-4">
        {guardians.map((g, i) => (
          <div
            key={i}
            className={`rounded-lg border p-4 transition-colors ${
              g.isPrimary ? 'border-primary/40 bg-primary/2' : ''
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant={g.isPrimary ? 'default' : 'outline'}
                  className="cursor-pointer text-[10px]"
                  onClick={() => setPrimary(i)}
                >
                  {g.isPrimary ? 'Primary' : 'Set as primary'}
                </Badge>
                <span className="text-xs font-medium text-muted-foreground">Guardian {i + 1}</span>
              </div>
              {guardians.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeGuardian(i)}
                  className="size-7 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={g.name}
                  onChange={(e) => updateGuardian(i, 'name', e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Relation <span className="text-destructive">*</span>
                </Label>
                <Select value={g.relation} onValueChange={(v) => updateGuardian(i, 'relation', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONS.map((r) => (
                      <SelectItem key={r} value={r} className="capitalize">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={g.phone}
                    onChange={(e) => updateGuardian(i, 'phone', e.target.value)}
                    placeholder="9876543210"
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    value={g.email}
                    onChange={(e) => updateGuardian(i, 'email', e.target.value)}
                    placeholder="email@example.com"
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Occupation</Label>
                <Input
                  value={g.occupation}
                  onChange={(e) => updateGuardian(i, 'occupation', e.target.value)}
                  placeholder="e.g. Engineer"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">WhatsApp Number</Label>
                <div className="relative">
                  <Smartphone className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={g.whatsappNumber}
                    onChange={(e) => updateGuardian(i, 'whatsappNumber', e.target.value)}
                    placeholder="If different from phone"
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Address</Label>
                <Input
                  value={g.address}
                  onChange={(e) => updateGuardian(i, 'address', e.target.value)}
                  placeholder="If different from student"
                />
              </div>
            </div>

            {g.phone && (
              <p className="mt-3 text-[10px] text-muted-foreground">
                A parent login account will be auto-created for <strong>{g.phone}</strong>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Step 4: Fee Assignment & Payment
   ============================================================ */

function FeeStep({
  feeStructures,
  totalFees,
  loadingFees,
  assignFees,
  onAssignFeesChange,
  collectPayment,
  onCollectPaymentChange,
  payment,
  onPaymentChange,
  className,
}: {
  feeStructures: FeeStructure[];
  totalFees: number;
  loadingFees: boolean;
  assignFees: boolean;
  onAssignFeesChange: (v: boolean) => void;
  collectPayment: boolean;
  onCollectPaymentChange: (v: boolean) => void;
  payment: { amount: string; paymentMode: string; transactionId: string; remarks: string };
  onPaymentChange: (v: typeof payment) => void;
  className?: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold">Fee Assignment</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Assign applicable fees and optionally collect first payment
        </p>
      </div>

      {/* Toggle fee assignment */}
      <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
        <input
          type="checkbox"
          checked={assignFees}
          onChange={(e) => {
            onAssignFeesChange(e.target.checked);
            if (!e.target.checked) onCollectPaymentChange(false);
          }}
          className="size-4 rounded border-muted-foreground/30"
        />
        <div className="flex-1">
          <p className="text-xs font-medium">Assign fees for {className ?? 'selected class'}</p>
          <p className="text-[10px] text-muted-foreground">
            All active fee structures for this class will be assigned
          </p>
        </div>
        {assignFees && totalFees > 0 && (
          <Badge variant="secondary" className="font-mono text-xs">
            {fmt(totalFees)}
          </Badge>
        )}
      </label>

      {/* Fee structures list */}
      {assignFees && (
        <div className="space-y-2">
          {loadingFees ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-xs text-muted-foreground">Loading fee structures...</span>
            </div>
          ) : feeStructures.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <IndianRupee className="mx-auto size-6 text-muted-foreground/40" />
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                No fee structures defined
              </p>
              <p className="text-[10px] text-muted-foreground">
                Create fee structures in Fees → Structures first
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y rounded-lg border">
                {feeStructures.map((f) => (
                  <div key={f.id} className="flex items-center justify-between px-3 py-2.5">
                    <div>
                      <p className="text-xs font-medium">{f.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {f.feeHeadName}
                        {f.dueDate ? ` · Due: ${f.dueDate}` : ''}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold tabular-nums">
                      {fmt(f.amount)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-muted/50 px-3 py-2.5">
                  <span className="text-xs font-semibold">Total</span>
                  <span className="font-mono text-sm font-bold tabular-nums">{fmt(totalFees)}</span>
                </div>
              </div>

              {/* Collect payment toggle */}
              <Separator className="my-3" />

              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={collectPayment}
                  onChange={(e) => onCollectPaymentChange(e.target.checked)}
                  className="size-4 rounded border-muted-foreground/30"
                />
                <div>
                  <p className="text-xs font-medium">Collect first payment now</p>
                  <p className="text-[10px] text-muted-foreground">
                    Record a payment during admission
                  </p>
                </div>
              </label>

              {/* Payment form */}
              {collectPayment && (
                <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Amount (₹)</Label>
                      <Input
                        type="number"
                        value={payment.amount}
                        onChange={(e) => onPaymentChange({ ...payment, amount: e.target.value })}
                        placeholder={String(totalFees / 100)}
                        min={1}
                        max={totalFees / 100}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Payment Mode</Label>
                      <Select
                        value={payment.paymentMode}
                        onValueChange={(v) => onPaymentChange({ ...payment, paymentMode: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_MODES.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {payment.paymentMode !== 'cash' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Transaction / Ref ID</Label>
                      <Input
                        value={payment.transactionId}
                        onChange={(e) =>
                          onPaymentChange({ ...payment, transactionId: e.target.value })
                        }
                        placeholder="UPI ref / Cheque no."
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Remarks</Label>
                    <Input
                      value={payment.remarks}
                      onChange={(e) => onPaymentChange({ ...payment, remarks: e.target.value })}
                      placeholder="Optional note"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Step 5: Review & Confirm
   ============================================================ */

function ReviewStep({
  student,
  classForm,
  selectedClass,
  selectedSection,
  guardians,
  feeStructures,
  totalFees,
  assignFees,
  collectPayment,
  payment,
}: {
  student: StudentForm;
  classForm: { classId: string; sectionId: string; rollNumber: string; admissionDate: string };
  selectedClass?: ClassItem;
  selectedSection?: { id: string; name: string };
  guardians: Guardian[];
  feeStructures: FeeStructure[];
  totalFees: number;
  assignFees: boolean;
  collectPayment: boolean;
  payment: { amount: string; paymentMode: string; transactionId: string; remarks: string };
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold">Review Admission Details</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Please verify all information before confirming
        </p>
      </div>

      {/* Student */}
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <User className="size-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Student
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <ReviewField label="Name" value={student.name} />
          <ReviewField label="DOB" value={student.dateOfBirth} />
          <ReviewField label="Gender" value={student.gender} />
          <ReviewField label="Blood Group" value={student.bloodGroup} />
          <ReviewField label="Category" value={student.category} />
          <ReviewField label="Religion" value={student.religion} />
          {student.phone && <ReviewField label="Phone" value={student.phone} />}
          {student.email && <ReviewField label="Email" value={student.email} />}
          {student.aadhaarNumber && <ReviewField label="Aadhaar" value={student.aadhaarNumber} />}
          {student.address && (
            <ReviewField
              label="Address"
              value={[student.address, student.city, student.state, student.pincode]
                .filter(Boolean)
                .join(', ')}
              span
            />
          )}
        </div>
      </div>

      {/* Class */}
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="size-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Class
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <ReviewField label="Class" value={selectedClass?.name ?? ''} />
          <ReviewField label="Section" value={selectedSection?.name ?? ''} />
          {classForm.rollNumber && <ReviewField label="Roll No" value={classForm.rollNumber} />}
          <ReviewField label="Admission Date" value={classForm.admissionDate} />
        </div>
      </div>

      {/* Guardians */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Guardians ({guardians.length})
          </span>
        </div>
        {guardians.map((g, i) => (
          <div key={i} className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-background text-xs font-bold">
              {g.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium">
                {g.name}
                {g.isPrimary && (
                  <Badge variant="default" className="ml-2 text-[9px]">
                    Primary
                  </Badge>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {g.relation} · {g.phone}
                {g.email ? ` · ${g.email}` : ''}
                {g.whatsappNumber ? ` · WA: ${g.whatsappNumber}` : ''}
              </p>
            </div>
            <Badge variant="outline" className="text-[9px]">
              Parent login will be created
            </Badge>
          </div>
        ))}
      </div>

      {/* Fees */}
      {assignFees && feeStructures.length > 0 && (
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="size-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fees
            </span>
          </div>
          <div className="divide-y rounded-md border">
            {feeStructures.map((f) => (
              <div key={f.id} className="flex justify-between px-3 py-1.5">
                <span className="text-xs">{f.name}</span>
                <span className="font-mono text-xs font-medium tabular-nums">{fmt(f.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between bg-muted/50 px-3 py-2">
              <span className="text-xs font-semibold">Total</span>
              <span className="font-mono text-sm font-bold tabular-nums">{fmt(totalFees)}</span>
            </div>
          </div>

          {collectPayment && payment.amount && (
            <div className="mt-2 flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 dark:bg-emerald-950/30">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              <span className="text-xs text-emerald-700 dark:text-emerald-400">
                Collecting {fmt(Math.round(parseFloat(payment.amount) * 100))} via{' '}
                <span className="capitalize">{payment.paymentMode}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewField({
  label,
  value,
  span = false,
}: {
  label: string;
  value: string;
  span?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={span ? 'col-span-2' : ''}>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-medium capitalize">{value}</p>
    </div>
  );
}
