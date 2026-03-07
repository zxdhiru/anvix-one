'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@anvix/ui/components/ui/select';
import {
  School,
  CalendarDays,
  Layers,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  Sparkles,
  PartyPopper,
} from 'lucide-react';

type Step = 'profile' | 'academic' | 'classes' | 'subjects' | 'complete';

interface ProfileData {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  board: string;
  phone: string;
  email: string;
}

interface AcademicData {
  yearName: string;
  startDate: string;
  endDate: string;
  term1Name: string;
  term1Start: string;
  term1End: string;
  term2Name: string;
  term2Start: string;
  term2End: string;
}

const STEPS: Step[] = ['profile', 'academic', 'classes', 'subjects', 'complete'];

const STEP_META: Record<Step, { icon: typeof School; label: string }> = {
  profile: { icon: School, label: 'School Profile' },
  academic: { icon: CalendarDays, label: 'Academic Year' },
  classes: { icon: Layers, label: 'Classes' },
  subjects: { icon: BookOpen, label: 'Subjects' },
  complete: { icon: Check, label: 'Done' },
};

export default function SetupPage() {
  const t = useTranslations('setup');
  const common = useTranslations('common');
  const router = useRouter();
  const { token, tenantSlug } = useAuth();

  const [currentStep, setCurrentStep] = useState<Step>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [profile, setProfile] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    board: 'cbse',
    phone: '',
    email: '',
  });

  const [academic, setAcademic] = useState({
    yearName: '2025-26',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    term1Name: 'Term 1',
    term1Start: '2025-04-01',
    term1End: '2025-09-30',
    term2Name: 'Term 2',
    term2Start: '2025-10-01',
    term2End: '2026-03-31',
  });

  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [classResult, setClassResult] = useState<{ classes: number; sections: number } | null>(
    null,
  );
  const [subjectCount, setSubjectCount] = useState<number | null>(null);

  const stepIndex = STEPS.indexOf(currentStep);

  function api(path: string, opts: RequestInit = {}) {
    return apiClient(path, {
      ...opts,
      tenantSlug: tenantSlug ?? undefined,
      token: token ?? undefined,
    });
  }

  async function handleSaveProfile() {
    setError('');
    setLoading(true);
    try {
      await api('/school/academics/profile', { method: 'PUT', body: JSON.stringify(profile) });
      setCurrentStep('academic');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAcademic() {
    setError('');
    setLoading(true);
    try {
      const year = (await api('/school/academics/years', {
        method: 'POST',
        body: JSON.stringify({
          name: academic.yearName,
          startDate: academic.startDate,
          endDate: academic.endDate,
          isCurrent: true,
        }),
      })) as { id: string };
      setAcademicYearId(year.id);

      await api('/school/academics/terms', {
        method: 'POST',
        body: JSON.stringify({
          academicYearId: year.id,
          name: academic.term1Name,
          startDate: academic.term1Start,
          endDate: academic.term1End,
          sortOrder: '1',
        }),
      });
      await api('/school/academics/terms', {
        method: 'POST',
        body: JSON.stringify({
          academicYearId: year.id,
          name: academic.term2Name,
          startDate: academic.term2Start,
          endDate: academic.term2End,
          sortOrder: '2',
        }),
      });

      setCurrentStep('classes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create academic year');
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedClasses() {
    if (!academicYearId) return;
    setError('');
    setLoading(true);
    try {
      const result = (await api('/school/academics/classes/seed', {
        method: 'POST',
        body: JSON.stringify({ academicYearId }),
      })) as { classes: number; sections: number };
      setClassResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed classes');
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedSubjects() {
    setError('');
    setLoading(true);
    try {
      const result = (await api('/school/academics/subjects/seed', {
        method: 'POST',
        body: JSON.stringify({ board: profile.board }),
      })) as unknown[];
      setSubjectCount(Array.isArray(result) ? result.length : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed subjects');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto py-6 page-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-1">
        {STEPS.map((step, i) => {
          const StepIcon = STEP_META[step].icon;
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          return (
            <div key={step} className="flex items-center gap-1 flex-1">
              <div
                className={`flex size-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  isDone
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                      ? 'bg-primary/10 text-primary ring-2 ring-primary/20'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? <Check className="size-3.5" /> : <StepIcon className="size-3.5" />}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 rounded-full transition-colors ${i < stepIndex ? 'bg-primary' : 'bg-muted'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 'profile' && (
            <ProfileStep
              t={t}
              profile={profile}
              setProfile={setProfile}
              onNext={handleSaveProfile}
              loading={loading}
            />
          )}
          {currentStep === 'academic' && (
            <AcademicStep
              t={t}
              academic={academic}
              setAcademic={setAcademic}
              onNext={handleSaveAcademic}
              onBack={() => setCurrentStep('profile')}
              loading={loading}
            />
          )}
          {currentStep === 'classes' && (
            <ClassesStep
              t={t}
              onSeed={handleSeedClasses}
              classResult={classResult}
              loading={loading}
              onBack={() => setCurrentStep('academic')}
              onNext={() => setCurrentStep('subjects')}
            />
          )}
          {currentStep === 'subjects' && (
            <SubjectsStep
              t={t}
              board={profile.board}
              onSeed={handleSeedSubjects}
              subjectCount={subjectCount}
              loading={loading}
              onBack={() => setCurrentStep('classes')}
              onNext={() => setCurrentStep('complete')}
            />
          )}
          {currentStep === 'complete' && (
            <CompleteStep
              t={t}
              classResult={classResult}
              subjectCount={subjectCount}
              onDashboard={() => router.push('/')}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// =========================================
// Step Components
// =========================================

function ProfileStep({
  t,
  profile,
  setProfile,
  onNext,
  loading,
}: {
  t: ReturnType<typeof useTranslations<'setup'>>;
  profile: ProfileData;
  setProfile: (p: ProfileData) => void;
  onNext: () => void;
  loading: boolean;
}) {
  function update(field: keyof ProfileData, value: string) {
    setProfile({ ...profile, [field]: value });
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <School className="size-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{t('profileTitle')}</h2>
          <p className="text-xs text-muted-foreground">{t('profileDesc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs">{t('schoolName')} *</Label>
          <Input
            value={profile.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Delhi Public School"
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs">{t('address')}</Label>
          <Input
            value={profile.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="123 School Road"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t('city')}</Label>
          <Input
            value={profile.city}
            onChange={(e) => update('city', e.target.value)}
            placeholder="New Delhi"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t('state')}</Label>
          <Input
            value={profile.state}
            onChange={(e) => update('state', e.target.value)}
            placeholder="Delhi"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t('pincode')}</Label>
          <Input
            value={profile.pincode}
            onChange={(e) => update('pincode', e.target.value)}
            placeholder="110001"
            maxLength={6}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t('board')} *</Label>
          <Select value={profile.board} onValueChange={(v) => update('board', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cbse">CBSE</SelectItem>
              <SelectItem value="icse">ICSE</SelectItem>
              <SelectItem value="state">State Board</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t('phone')}</Label>
          <Input
            type="tel"
            value={profile.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="9876543210"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t('email')}</Label>
          <Input
            type="email"
            value={profile.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="school@example.com"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={onNext} disabled={loading || !profile.name}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> {t('saving')}
            </>
          ) : (
            <>
              {t('nextStep')} <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function AcademicStep({
  t,
  academic,
  setAcademic,
  onNext,
  onBack,
  loading,
}: {
  t: ReturnType<typeof useTranslations<'setup'>>;
  academic: AcademicData;
  setAcademic: (a: AcademicData) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  function update(field: keyof AcademicData, value: string) {
    setAcademic({ ...academic, [field]: value });
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
          <CalendarDays className="size-4 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{t('academicTitle')}</h2>
          <p className="text-xs text-muted-foreground">{t('academicDesc')}</p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('yearName')} *</Label>
            <Input value={academic.yearName} onChange={(e) => update('yearName', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('startDate')}</Label>
            <Input
              type="date"
              value={academic.startDate}
              onChange={(e) => update('startDate', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('endDate')}</Label>
            <Input
              type="date"
              value={academic.endDate}
              onChange={(e) => update('endDate', e.target.value)}
            />
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs font-medium mb-3">Term 1</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('term1Name')}</Label>
              <Input
                value={academic.term1Name}
                onChange={(e) => update('term1Name', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('term1Start')}</Label>
              <Input
                type="date"
                value={academic.term1Start}
                onChange={(e) => update('term1Start', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('term1End')}</Label>
              <Input
                type="date"
                value={academic.term1End}
                onChange={(e) => update('term1End', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium mb-3">Term 2</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('term2Name')}</Label>
              <Input
                value={academic.term2Name}
                onChange={(e) => update('term2Name', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('term2Start')}</Label>
              <Input
                type="date"
                value={academic.term2Start}
                onChange={(e) => update('term2Start', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('term2End')}</Label>
              <Input
                type="date"
                value={academic.term2End}
                onChange={(e) => update('term2End', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4" /> {t('previous')}
        </Button>
        <Button onClick={onNext} disabled={loading || !academic.yearName}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> {t('saving')}
            </>
          ) : (
            <>
              {t('nextStep')} <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ClassesStep({
  t,
  onSeed,
  classResult,
  loading,
  onBack,
  onNext,
}: {
  t: ReturnType<typeof useTranslations<'setup'>>;
  onSeed: () => void;
  classResult: { classes: number; sections: number } | null;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10">
          <Layers className="size-4 text-violet-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{t('classesTitle')}</h2>
          <p className="text-xs text-muted-foreground">{t('classesDesc')}</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-8">
        {classResult ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-8 py-6 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="size-5" />
            </div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {t('classesCreated', {
                classes: classResult.classes,
                sections: classResult.sections,
              })}
            </p>
          </div>
        ) : (
          <Button onClick={onSeed} disabled={loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {t('saving')}
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> {t('seedClasses')}
              </>
            )}
          </Button>
        )}
      </div>

      <div className="mt-4 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4" /> {t('previous')}
        </Button>
        {classResult && (
          <Button onClick={onNext}>
            {t('nextStep')} <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function SubjectsStep({
  t,
  board,
  onSeed,
  subjectCount,
  loading,
  onBack,
  onNext,
}: {
  t: ReturnType<typeof useTranslations<'setup'>>;
  board: string;
  onSeed: () => void;
  subjectCount: number | null;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
          <BookOpen className="size-4 text-amber-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{t('subjectsTitle')}</h2>
          <p className="text-xs text-muted-foreground">
            {t('subjectsDesc')}{' '}
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {board.toUpperCase()}
            </Badge>
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-8">
        {subjectCount !== null ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-8 py-6 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="size-5" />
            </div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {t('subjectsCreated', { count: subjectCount })}
            </p>
          </div>
        ) : (
          <Button onClick={onSeed} disabled={loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {t('saving')}
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> {t('seedSubjects')}
              </>
            )}
          </Button>
        )}
      </div>

      <div className="mt-4 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4" /> {t('previous')}
        </Button>
        {subjectCount !== null && (
          <Button onClick={onNext}>
            {t('nextStep')} <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function CompleteStep({
  t,
  classResult,
  subjectCount,
  onDashboard,
}: {
  t: ReturnType<typeof useTranslations<'setup'>>;
  classResult: { classes: number; sections: number } | null;
  subjectCount: number | null;
  onDashboard: () => void;
}) {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
        <PartyPopper className="size-7 text-primary" />
      </div>
      <h2 className="text-xl font-semibold">{t('completeTitle')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('completeDesc')}</p>

      <div className="mt-6 inline-flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Check className="size-4 text-emerald-500" /> School profile saved
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Check className="size-4 text-emerald-500" /> Academic year & terms created
        </div>
        {classResult && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Check className="size-4 text-emerald-500" /> {classResult.classes} classes with{' '}
            {classResult.sections} sections
          </div>
        )}
        {subjectCount !== null && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Check className="size-4 text-emerald-500" /> {subjectCount} subjects created
          </div>
        )}
      </div>

      <div className="mt-8">
        <Button onClick={onDashboard} size="lg">
          {t('goToDashboard')} <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
