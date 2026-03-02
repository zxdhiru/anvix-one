'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';

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

export default function SetupPage() {
  const t = useTranslations('setup');
  const common = useTranslations('common');
  const router = useRouter();
  const { token, tenantSlug } = useAuth();

  const [currentStep, setCurrentStep] = useState<Step>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Profile form state
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

  // Academic year form state
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

  // Track what was created
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

  // =========================================
  // Step handlers
  // =========================================

  async function handleSaveProfile() {
    setError('');
    setLoading(true);
    try {
      await api('/school/academics/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
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
      // Create academic year
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

      // Create terms
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

  // =========================================
  // Render
  // =========================================

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('title')}</h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">{t('subtitle')}</p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 mb-2">
          <span>{t('step', { current: stepIndex + 1, total: STEPS.length })}</span>
        </div>
        <div className="flex gap-1">
          {STEPS.map((step, i) => (
            <div
              key={step}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Step content */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
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
      </div>
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
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t('profileTitle')}</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('profileDesc')}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t('schoolName')} *
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            placeholder="Delhi Public School"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t('address')}
          </label>
          <input
            type="text"
            value={profile.address}
            onChange={(e) => update('address', e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            placeholder="123 School Road"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t('city')}
          </label>
          <input
            type="text"
            value={profile.city}
            onChange={(e) => update('city', e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            placeholder="New Delhi"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t('state')}
          </label>
          <input
            type="text"
            value={profile.state}
            onChange={(e) => update('state', e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            placeholder="Delhi"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t('pincode')}
          </label>
          <input
            type="text"
            value={profile.pincode}
            onChange={(e) => update('pincode', e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            placeholder="110001"
            maxLength={6}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t('board')} *
          </label>
          <select
            value={profile.board}
            onChange={(e) => update('board', e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          >
            <option value="cbse">CBSE</option>
            <option value="icse">ICSE</option>
            <option value="state">State Board</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t('phone')}
          </label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            placeholder="9876543210"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t('email')}
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => update('email', e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            placeholder="school@example.com"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onNext}
          disabled={loading || !profile.name}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t('saving') : t('nextStep')}
        </button>
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
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t('academicTitle')}</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('academicDesc')}</p>

      <div className="mt-6 space-y-6">
        {/* Academic Year */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t('yearName')} *
            </label>
            <input
              type="text"
              value={academic.yearName}
              onChange={(e) => update('yearName', e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t('startDate')}
            </label>
            <input
              type="date"
              value={academic.startDate}
              onChange={(e) => update('startDate', e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t('endDate')}
            </label>
            <input
              type="date"
              value={academic.endDate}
              onChange={(e) => update('endDate', e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            />
          </div>
        </div>

        <hr className="border-zinc-200 dark:border-zinc-700" />

        {/* Term 1 */}
        <div>
          <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-3">Term 1</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                {t('term1Name')}
              </label>
              <input
                type="text"
                value={academic.term1Name}
                onChange={(e) => update('term1Name', e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                {t('term1Start')}
              </label>
              <input
                type="date"
                value={academic.term1Start}
                onChange={(e) => update('term1Start', e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                {t('term1End')}
              </label>
              <input
                type="date"
                value={academic.term1End}
                onChange={(e) => update('term1End', e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Term 2 */}
        <div>
          <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-3">Term 2</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                {t('term2Name')}
              </label>
              <input
                type="text"
                value={academic.term2Name}
                onChange={(e) => update('term2Name', e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                {t('term2Start')}
              </label>
              <input
                type="date"
                value={academic.term2Start}
                onChange={(e) => update('term2Start', e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                {t('term2End')}
              </label>
              <input
                type="date"
                value={academic.term2End}
                onChange={(e) => update('term2End', e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={onBack}
          className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {t('previous')}
        </button>
        <button
          onClick={onNext}
          disabled={loading || !academic.yearName}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t('saving') : t('nextStep')}
        </button>
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
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t('classesTitle')}</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('classesDesc')}</p>

      <div className="mt-8 text-center">
        {classResult ? (
          <div className="rounded-lg bg-green-50 p-6 dark:bg-green-950/30">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-green-700 dark:text-green-400 font-medium">
              {t('classesCreated', {
                classes: classResult.classes,
                sections: classResult.sections,
              })}
            </p>
          </div>
        ) : (
          <button
            onClick={onSeed}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t('saving') : t('seedClasses')}
          </button>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {t('previous')}
        </button>
        {classResult && (
          <button
            onClick={onNext}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {t('nextStep')}
          </button>
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
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t('subjectsTitle')}</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {t('subjectsDesc')} ({board.toUpperCase()})
      </p>

      <div className="mt-8 text-center">
        {subjectCount !== null ? (
          <div className="rounded-lg bg-green-50 p-6 dark:bg-green-950/30">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-green-700 dark:text-green-400 font-medium">
              {t('subjectsCreated', { count: subjectCount })}
            </p>
          </div>
        ) : (
          <button
            onClick={onSeed}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t('saving') : t('seedSubjects')}
          </button>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {t('previous')}
        </button>
        {subjectCount !== null && (
          <button
            onClick={onNext}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {t('nextStep')}
          </button>
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
    <div className="text-center py-8">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('completeTitle')}</h2>
      <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t('completeDesc')}</p>

      <div className="mt-6 inline-flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <p>✅ School profile saved</p>
        <p>✅ Academic year &amp; terms created</p>
        {classResult && (
          <p>
            ✅ {classResult.classes} classes with {classResult.sections} sections
          </p>
        )}
        {subjectCount !== null && <p>✅ {subjectCount} subjects created</p>}
      </div>

      <div className="mt-8">
        <button
          onClick={onDashboard}
          className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {t('goToDashboard')}
        </button>
      </div>
    </div>
  );
}
