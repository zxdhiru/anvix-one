'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@anvix/ui/components/ui/card';
import { Badge } from '@anvix/ui/components/ui/badge';
import { Skeleton } from '@anvix/ui/components/ui/skeleton';
import {
  GraduationCap,
  Phone,
  Mail,
  Calendar,
  BookOpen,
  Layers,
  UserCircle,
  AlertCircle,
} from 'lucide-react';

interface Guardian {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email: string | null;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  dateOfBirth: string | null;
  gender: string;
  className: string | null;
  sectionName: string | null;
  rollNumber: number | null;
  isActive: boolean;
}

interface ChildDetail extends Child {
  bloodGroup: string | null;
  category: string | null;
  religion: string | null;
  address: string | null;
  guardians: Guardian[];
}

export default function MyChildrenPage() {
  const { token, tenantSlug } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tenantSlug) return;
    setLoading(true);
    apiClient('/school/guardians/my-children', { tenantSlug, token: token ?? undefined })
      .then((data) => {
        const raw = Array.isArray(data) ? data : [];
        // API returns snake_case — normalize to camelCase
        const list: Child[] = raw.map((c: Record<string, unknown>) => ({
          id: (c.student_id ?? c.id ?? '') as string,
          firstName: ((c.student_name ?? c.firstName ?? '') as string).split(' ')[0] ?? '',
          lastName: ((c.student_name ?? c.lastName ?? '') as string).split(' ').slice(1).join(' '),
          admissionNumber: (c.admission_number ?? c.admissionNumber ?? '') as string,
          dateOfBirth: (c.date_of_birth ?? c.dateOfBirth ?? null) as string | null,
          gender: (c.gender ?? '') as string,
          className: (c.class_name ?? c.className ?? null) as string | null,
          sectionName: (c.section_name ?? c.sectionName ?? null) as string | null,
          rollNumber: (c.roll_number ?? c.rollNumber ?? null) as number | null,
          isActive: (c.is_active ?? c.isActive ?? true) as boolean,
        }));
        setChildren(list);
        if (list.length > 0) {
          loadChildDetail(list[0].id);
        }
      })
      .catch((err) => setError(err.message || 'Failed to load children'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug, token]);

  async function loadChildDetail(studentId: string) {
    if (!tenantSlug) return;
    setDetailLoading(true);
    try {
      const raw = (await apiClient(`/school/guardians/my-children/${studentId}`, {
        tenantSlug,
        token: token ?? undefined,
      })) as { student: Record<string, unknown>; className: string; sectionName: string };
      const s = raw.student ?? raw;
      setSelectedChild({
        id: (s.id ?? studentId) as string,
        firstName: ((s.name ?? '') as string).split(' ')[0] ?? '',
        lastName: ((s.name ?? '') as string).split(' ').slice(1).join(' '),
        admissionNumber: (s.admission_number ?? '') as string,
        dateOfBirth: (s.date_of_birth ?? null) as string | null,
        gender: (s.gender ?? '') as string,
        className: raw.className ?? ((s.class_name ?? null) as string | null),
        sectionName: raw.sectionName ?? ((s.section_name ?? null) as string | null),
        rollNumber: (s.roll_number ?? null) as number | null,
        isActive: (s.is_active ?? true) as boolean,
        bloodGroup: (s.blood_group ?? null) as string | null,
        category: (s.category ?? null) as string | null,
        religion: (s.religion ?? null) as string | null,
        address: (s.address ?? null) as string | null,
        guardians: [],
      });
    } catch {
      // Silently fail — main list already loaded
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 page-fade-in">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My Children</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            View your children&apos;s details and academic information
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 page-fade-in">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My Children</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="mt-3 text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="space-y-6 page-fade-in">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My Children</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            View your children&apos;s details and academic information
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <GraduationCap className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-medium">No children linked</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Contact your school admin to link your children to your account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">My Children</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          View your children&apos;s details and academic information
        </p>
      </div>

      {/* Children cards — select to view detail */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children.map((child) => {
          const isSelected = selectedChild?.id === child.id;
          return (
            <button
              key={child.id}
              type="button"
              onClick={() => loadChildDetail(child.id)}
              className={`group cursor-pointer text-left transition-all ${
                isSelected
                  ? 'ring-2 ring-primary ring-offset-2 rounded-xl'
                  : 'hover:shadow-md rounded-xl'
              }`}
            >
              <Card className="h-full">
                <CardContent className="flex items-center gap-4 py-5">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                    <GraduationCap className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {child.firstName} {child.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {child.className ?? 'Unassigned'}
                      {child.sectionName ? ` — ${child.sectionName}` : ''}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {child.admissionNumber}
                      </Badge>
                      {child.rollNumber && (
                        <Badge variant="secondary" className="text-[10px]">
                          Roll #{child.rollNumber}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Selected child detail */}
      {detailLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      ) : selectedChild ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Student Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <UserCircle className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Student Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <InfoRow
                  label="Name"
                  value={`${selectedChild.firstName} ${selectedChild.lastName}`}
                />
                <InfoRow label="Admission No." value={selectedChild.admissionNumber} />
                <InfoRow label="Gender" value={selectedChild.gender} />
                {selectedChild.dateOfBirth && (
                  <InfoRow
                    label="Date of Birth"
                    value={new Date(selectedChild.dateOfBirth).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  />
                )}
                {selectedChild.bloodGroup && (
                  <InfoRow label="Blood Group" value={selectedChild.bloodGroup} />
                )}
                {selectedChild.category && (
                  <InfoRow label="Category" value={selectedChild.category} />
                )}
                {selectedChild.address && <InfoRow label="Address" value={selectedChild.address} />}
              </dl>
            </CardContent>
          </Card>

          {/* Academic Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Academic Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <InfoRow label="Class" value={selectedChild.className ?? 'Unassigned'} />
                <InfoRow label="Section" value={selectedChild.sectionName ?? '—'} />
                <InfoRow label="Roll Number" value={selectedChild.rollNumber?.toString() ?? '—'} />
                <InfoRow label="Status" value={selectedChild.isActive ? 'Active' : 'Inactive'} />
              </dl>
            </CardContent>
          </Card>

          {/* Guardian Info */}
          {selectedChild.guardians && selectedChild.guardians.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">
                    Guardians ({selectedChild.guardians.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {selectedChild.guardians.map((g) => (
                    <div key={g.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {g.name[0]?.toUpperCase() ?? 'G'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{g.name}</p>
                        <p className="text-xs capitalize text-muted-foreground">{g.relation}</p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="size-3" /> {g.phone}
                        </div>
                        {g.email && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="size-3" /> {g.email}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
