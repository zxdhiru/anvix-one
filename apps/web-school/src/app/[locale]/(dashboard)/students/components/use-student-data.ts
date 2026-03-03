'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import type { StudentDetail, StudentFee, FeePayment, FeeSummary } from './types';

function asArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

export function useStudentData(studentId: string) {
  const { token, tenantSlug } = useAuth();

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const api = useCallback(
    (path: string, opts: RequestInit = {}) =>
      apiClient(path, { ...opts, tenantSlug: tenantSlug ?? undefined, token: token ?? undefined }),
    [tenantSlug, token],
  );

  const fetchStudent = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api(`/school/students/${studentId}`);
      setStudent(data as StudentDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load student');
    } finally {
      setLoading(false);
    }
  }, [api, studentId]);

  const fetchFees = useCallback(async () => {
    try {
      const [feesData, paymentsData, summaryData] = await Promise.all([
        api(`/school/fees/student-fees?studentId=${studentId}`).catch(() => []),
        api(`/school/fees/payments?studentId=${studentId}`).catch(() => []),
        api(`/school/fees/summary?studentId=${studentId}`).catch(() => null),
      ]);
      setFees(asArray<StudentFee>(feesData));
      setPayments(asArray<FeePayment>(paymentsData));
      if (summaryData && typeof summaryData === 'object') {
        setSummary(summaryData as FeeSummary);
      }
    } catch {
      // fees are non-critical, silent fail
    }
  }, [api, studentId]);

  useEffect(() => {
    fetchStudent();
    fetchFees();
  }, [fetchStudent, fetchFees]);

  const refresh = useCallback(() => {
    fetchStudent();
    fetchFees();
  }, [fetchStudent, fetchFees]);

  return { student, fees, payments, summary, loading, error, refresh, api };
}
