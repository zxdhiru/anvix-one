'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Button } from '@anvix/ui/components/ui/button';
import { Input } from '@anvix/ui/components/ui/input';
import { Label } from '@anvix/ui/components/ui/label';
import { Badge } from '@anvix/ui/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@anvix/ui/components/ui/card';
import { Separator } from '@anvix/ui/components/ui/separator';
import { Skeleton } from '@anvix/ui/components/ui/skeleton';
import { Textarea } from '@anvix/ui/components/ui/textarea';
import {
  School,
  CalendarDays,
  Layers,
  BookOpen,
  Save,
  Loader2,
  Plus,
  Pencil,
  Check,
  X,
} from 'lucide-react';

interface SchoolProfile {
  name: string;
  address: string;
  board: string;
  phone: string;
  email: string;
  website: string;
  establishedYear: number | null;
}

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface ClassItem {
  id: string;
  name: string;
  displayOrder: number;
  sections?: { id: string; name: string }[];
}

interface SubjectItem {
  id: string;
  name: string;
  code: string | null;
}

export default function SettingsPage() {
  const nav = useTranslations('nav');
  const { token, tenantSlug } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<SchoolProfile>({
    name: '',
    address: '',
    board: '',
    phone: '',
    email: '',
    website: '',
    establishedYear: null,
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const api = useCallback(
    (path: string, opts: RequestInit = {}) =>
      apiClient(path, { ...opts, tenantSlug: tenantSlug ?? undefined, token: token ?? undefined }),
    [tenantSlug, token],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, yearData, classData, subjectData] = await Promise.all([
        api('/school/academics/profile').catch(() => null),
        api('/school/academics/years').catch(() => []),
        api('/school/academics/classes').catch(() => []),
        api('/school/academics/subjects').catch(() => []),
      ]);

      if (profileData) {
        setProfile(profileData);
        setProfileForm({
          name: profileData.name ?? '',
          address: profileData.address ?? '',
          board: profileData.board ?? '',
          phone: profileData.phone ?? '',
          email: profileData.email ?? '',
          website: profileData.website ?? '',
          establishedYear: profileData.establishedYear ?? null,
        });
      }
      setAcademicYears(Array.isArray(yearData) ? yearData : []);

      // Fetch sections for each class
      const classesWithSections = await Promise.all(
        (Array.isArray(classData) ? classData : []).map(async (cls: ClassItem) => {
          const sections = await api(`/school/academics/classes/${cls.id}/sections`).catch(
            () => [],
          );
          return { ...cls, sections: Array.isArray(sections) ? sections : [] };
        }),
      );
      setClasses(classesWithSections);
      setSubjects(Array.isArray(subjectData) ? subjectData : []);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      await api('/school/academics/profile', {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      });
      setProfile(profileForm);
      setEditingProfile(false);
    } catch {
      // keep editing open
    } finally {
      setSavingProfile(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 page-fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-fade-in">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{nav('settings')}</h1>
        <p className="text-sm text-muted-foreground">Manage your school configuration</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* School Profile */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <School className="size-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm">School Profile</CardTitle>
                <CardDescription className="text-xs">
                  Basic information about your school
                </CardDescription>
              </div>
            </div>
            {!editingProfile ? (
              <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)}>
                <Pencil className="size-3.5" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingProfile(false);
                    if (profile) setProfileForm(profile);
                  }}
                >
                  <X className="size-3.5" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {editingProfile ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">School Name</Label>
                  <Input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Address</Label>
                  <Textarea
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Board</Label>
                  <Input
                    value={profileForm.board}
                    onChange={(e) => setProfileForm({ ...profileForm, board: e.target.value })}
                    placeholder="CBSE, ICSE, State Board"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Established Year</Label>
                  <Input
                    type="number"
                    value={profileForm.establishedYear ?? ''}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        establishedYear: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Website</Label>
                  <Input
                    value={profileForm.website}
                    onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                    placeholder="https://"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <DetailRow label="Name" value={profile?.name} />
                <DetailRow label="Board" value={profile?.board} />
                <DetailRow label="Address" value={profile?.address} className="col-span-2" />
                <DetailRow label="Phone" value={profile?.phone} />
                <DetailRow label="Email" value={profile?.email} />
                <DetailRow label="Website" value={profile?.website} />
                <DetailRow label="Established" value={profile?.establishedYear?.toString()} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Academic Years */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <CalendarDays className="size-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-sm">Academic Years</CardTitle>
                <CardDescription className="text-xs">
                  {academicYears.length} year{academicYears.length !== 1 ? 's' : ''} configured
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {academicYears.length === 0 ? (
              <p className="text-xs text-muted-foreground">No academic years configured yet.</p>
            ) : (
              <div className="space-y-2">
                {academicYears.map((year) => (
                  <div
                    key={year.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{year.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(year.startDate).toLocaleDateString('en-IN')} —{' '}
                        {new Date(year.endDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    {year.isCurrent && (
                      <Badge className="text-[10px]">
                        <Check className="mr-1 size-2.5" /> Current
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Classes & Sections */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10">
                <Layers className="size-4 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-sm">Classes & Sections</CardTitle>
                <CardDescription className="text-xs">
                  {classes.length} class{classes.length !== 1 ? 'es' : ''}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No classes configured yet.</p>
            ) : (
              <div className="space-y-2">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <p className="text-sm font-medium">{cls.name}</p>
                    <div className="flex gap-1">
                      {cls.sections && cls.sections.length > 0 ? (
                        cls.sections.map((sec) => (
                          <Badge key={sec.id} variant="secondary" className="text-[10px]">
                            {sec.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-[11px] text-muted-foreground">No sections</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subjects */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
                <BookOpen className="size-4 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-sm">Subjects</CardTitle>
                <CardDescription className="text-xs">
                  {subjects.length} subject{subjects.length !== 1 ? 's' : ''} configured
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <p className="text-xs text-muted-foreground">No subjects configured yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <Badge key={subject.id} variant="outline" className="text-xs">
                    <BookOpen className="mr-1.5 size-3" />
                    {subject.name}
                    {subject.code && (
                      <span className="ml-1.5 text-muted-foreground">({subject.code})</span>
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value || <span className="text-muted-foreground">—</span>}</p>
    </div>
  );
}
