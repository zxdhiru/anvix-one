'use client';

import { Suspense, useMemo } from 'react';
import { Skeleton } from '@anvix/ui/components/ui/skeleton';
import {
  OverviewTab,
  FeeHeadsTab,
  StructuresTab,
  StudentFeesTab,
  CollectTab,
  PaymentsTab,
  FeeTabs,
  useFeesData,
  useFeeUrlState,
} from './components';

function FeesPageInner() {
  const {
    loading,
    feeHeads,
    feeStructures,
    studentFees,
    payments,
    summary,
    classes,
    curYear,
    api,
    load,
  } = useFeesData();

  const {
    tab,
    classFilter,
    statusFilter,
    searchQuery,
    structClassFilter,
    setTab,
    setClassFilter,
    setStatusFilter,
    setSearchQuery,
    setStructClassFilter,
  } = useFeeUrlState();

  /* ---- Derived / filtered data (memoized) ---- */

  const filteredStudentFees = useMemo(() => {
    return studentFees.filter((s) => {
      if (classFilter !== 'all' && s.className !== classFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !s.studentName?.toLowerCase().includes(q) &&
          !s.admissionNumber?.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [studentFees, classFilter, statusFilter, searchQuery]);

  const filteredStructures = useMemo(
    () =>
      feeStructures.filter((f) => structClassFilter === 'all' || f.classId === structClassFilter),
    [feeStructures, structClassFilter],
  );

  const collectableFees = useMemo(
    () => studentFees.filter((s) => s.status !== 'paid' && s.status !== 'waived'),
    [studentFees],
  );

  if (loading) {
    return (
      <div className="space-y-6 page-fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Fee Management</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {curYear
              ? `Academic Year ${curYear.name}`
              : 'Configure fee structures, collect payments, and track dues'}
          </p>
        </div>
      </div>

      <FeeTabs activeTab={tab} onTabChange={setTab} />

      {tab === 'overview' && <OverviewTab summary={summary} payments={payments} />}
      {tab === 'heads' && <FeeHeadsTab feeHeads={feeHeads} />}
      {tab === 'structures' && (
        <StructuresTab
          structures={filteredStructures}
          classes={classes}
          filterClass={structClassFilter}
          onFilterClass={setStructClassFilter}
        />
      )}
      {tab === 'student-fees' && (
        <StudentFeesTab
          studentFees={filteredStudentFees}
          classes={classes}
          classFilter={classFilter}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          onClassFilter={setClassFilter}
          onStatusFilter={setStatusFilter}
          onSearchQuery={setSearchQuery}
        />
      )}
      {tab === 'collect' && <CollectTab studentFees={collectableFees} api={api} onRefresh={load} />}
      {tab === 'payments' && (
        <PaymentsTab payments={payments} searchQuery={searchQuery} onSearchQuery={setSearchQuery} />
      )}
    </div>
  );
}

/** Suspense boundary required for useSearchParams() */
export default function FeesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 page-fade-in">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      }
    >
      <FeesPageInner />
    </Suspense>
  );
}
