'use client';

import { memo, useMemo } from 'react';
import Image from 'next/image';
import { Badge } from '@anvix/ui/components/ui/badge';
import { Card } from '@anvix/ui/components/ui/card';
import { Calendar, Phone, Mail, MapPin, Hash, Droplets, User } from 'lucide-react';
import type { StudentDetail } from './types';

function formatDate(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface StudentHeaderProps {
  student: StudentDetail;
}

export const StudentHeader = memo(function StudentHeader({ student }: StudentHeaderProps) {
  const initials = student.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const age = useMemo(() => {
    if (!student.dateOfBirth) return null;
    const now = new Date();
    const dob = new Date(student.dateOfBirth);
    let years = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years--;
    return years;
  }, [student.dateOfBirth]);

  return (
    <Card className="overflow-hidden">
      {/* Accent bar */}
      <div className="h-1.5 bg-linear-to-r from-primary/80 via-primary to-primary/60" />

      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary ring-2 ring-primary/20">
            {student.photoUrl ? (
              <Image
                src={student.photoUrl}
                alt={student.name}
                width={80}
                height={80}
                className="size-20 rounded-2xl object-cover"
              />
            ) : (
              initials
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">{student.name}</h1>
                <p className="text-sm text-muted-foreground font-mono">
                  {student.admissionNumber || 'No admission #'}
                </p>
              </div>
              <div className="flex gap-2 mt-0.5">
                <Badge
                  variant={student.isActive ? 'default' : 'destructive'}
                  className="text-xs px-2 py-0.5"
                >
                  {student.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {student.className && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {student.className}
                    {student.sectionName ? ` — ${student.sectionName}` : ''}
                  </Badge>
                )}
                {student.rollNumber && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    Roll #{student.rollNumber}
                  </Badge>
                )}
              </div>
            </div>

            {/* Detail chips */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {student.dateOfBirth && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {formatDate(student.dateOfBirth)}
                  {age !== null && <span className="text-xs">({age} yrs)</span>}
                </span>
              )}
              {student.gender && (
                <span className="flex items-center gap-1.5 capitalize">
                  <User className="size-3.5" />
                  {student.gender}
                </span>
              )}
              {student.bloodGroup && (
                <span className="flex items-center gap-1.5">
                  <Droplets className="size-3.5" />
                  {student.bloodGroup}
                </span>
              )}
              {student.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5" />
                  {student.phone}
                </span>
              )}
              {student.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  {student.email}
                </span>
              )}
              {student.aadhaarNumber && (
                <span className="flex items-center gap-1.5">
                  <Hash className="size-3.5" />
                  ····{student.aadhaarNumber.slice(-4)}
                </span>
              )}
              {(student.city || student.state) && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {[student.city, student.state].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});
