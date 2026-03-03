'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { asArray } from './utils';
import type {
  FeeHead,
  FeeStructure,
  StudentFee,
  FeePayment,
  FeeSummary,
  ClassItem,
  AcademicYear,
  Term,
  ApiCall,
} from './types';

interface FeesState {
  loading: boolean;
  feeHeads: FeeHead[];
  feeStructures: FeeStructure[];
  studentFees: StudentFee[];
  payments: FeePayment[];
  summary: FeeSummary | null;
  classes: ClassItem[];
  academicYears: AcademicYear[];
  terms: Term[];
}

type FeesAction =
  | { type: 'LOADING' }
  | { type: 'LOADED'; payload: Omit<FeesState, 'loading'> }
  | { type: 'SET_FEE_HEADS'; payload: FeeHead[] }
  | { type: 'SET_STRUCTURES'; payload: FeeStructure[] }
  | { type: 'SET_STUDENT_FEES'; payload: StudentFee[] }
  | { type: 'SET_PAYMENTS'; payload: FeePayment[] }
  | { type: 'SET_SUMMARY'; payload: FeeSummary | null }
  | { type: 'OPTIMISTIC_ADD_FEE_HEAD'; payload: FeeHead }
  | { type: 'OPTIMISTIC_ADD_STRUCTURE'; payload: FeeStructure }
  | { type: 'OPTIMISTIC_UPDATE_STUDENT_FEE'; payload: { id: string; patch: Partial<StudentFee> } }
  | { type: 'OPTIMISTIC_ADD_PAYMENT'; payload: FeePayment };

const initialState: FeesState = {
  loading: true,
  feeHeads: [],
  feeStructures: [],
  studentFees: [],
  payments: [],
  summary: null,
  classes: [],
  academicYears: [],
  terms: [],
};

function reducer(state: FeesState, action: FeesAction): FeesState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true };
    case 'LOADED':
      return { ...state, loading: false, ...action.payload };
    case 'SET_FEE_HEADS':
      return { ...state, feeHeads: action.payload };
    case 'SET_STRUCTURES':
      return { ...state, feeStructures: action.payload };
    case 'SET_STUDENT_FEES':
      return { ...state, studentFees: action.payload };
    case 'SET_PAYMENTS':
      return { ...state, payments: action.payload };
    case 'SET_SUMMARY':
      return { ...state, summary: action.payload };
    case 'OPTIMISTIC_ADD_FEE_HEAD':
      return { ...state, feeHeads: [...state.feeHeads, action.payload] };
    case 'OPTIMISTIC_ADD_STRUCTURE':
      return { ...state, feeStructures: [...state.feeStructures, action.payload] };
    case 'OPTIMISTIC_UPDATE_STUDENT_FEE':
      return {
        ...state,
        studentFees: state.studentFees.map((sf) =>
          sf.id === action.payload.id ? { ...sf, ...action.payload.patch } : sf,
        ),
      };
    case 'OPTIMISTIC_ADD_PAYMENT':
      return { ...state, payments: [action.payload, ...state.payments] };
    default:
      return state;
  }
}

export function useFeesData() {
  const { token, tenantSlug } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef<AbortController | null>(null);

  const api: ApiCall = useCallback(
    (path: string, opts: RequestInit = {}) =>
      apiClient(path, { ...opts, tenantSlug: tenantSlug ?? undefined, token: token ?? undefined }),
    [tenantSlug, token],
  );

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    dispatch({ type: 'LOADING' });
    try {
      const [h, st, sf, p, su, c, ay] = await Promise.all([
        api('/school/fees/heads').catch(() => []),
        api('/school/fees/structures').catch(() => []),
        api('/school/fees/student-fees').catch(() => []),
        api('/school/fees/payments').catch(() => []),
        api('/school/fees/summary').catch(() => null),
        api('/school/academics/classes').catch(() => []),
        api('/school/academics/years').catch(() => []),
      ]);
      if (ctrl.signal.aborted) return;

      const yearsArr = asArray<AcademicYear>(ay);
      let termsArr: Term[] = [];
      const cur = yearsArr.find((y) => y.isCurrent);
      if (cur) {
        const t = await api(`/school/academics/years/${cur.id}/terms`).catch(() => []);
        if (!ctrl.signal.aborted) termsArr = asArray<Term>(t);
      }

      if (!ctrl.signal.aborted) {
        dispatch({
          type: 'LOADED',
          payload: {
            feeHeads: asArray<FeeHead>(h),
            feeStructures: asArray<FeeStructure>(st),
            studentFees: asArray<StudentFee>(sf),
            payments: asArray<FeePayment>(p),
            summary: su && typeof su === 'object' ? (su as FeeSummary) : null,
            classes: asArray<ClassItem>(c),
            academicYears: yearsArr,
            terms: termsArr,
          },
        });
      }
    } catch {
      if (!ctrl.signal.aborted) {
        dispatch({
          type: 'LOADED',
          payload: initialState,
        });
      }
    }
  }, [api]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  const curYear = useMemo(
    () => state.academicYears.find((y) => y.isCurrent) ?? null,
    [state.academicYears],
  );

  return { ...state, curYear, api, load, dispatch };
}
