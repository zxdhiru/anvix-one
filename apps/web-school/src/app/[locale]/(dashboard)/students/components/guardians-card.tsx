'use client';

import { memo } from 'react';
import { Card } from '@anvix/ui/components/ui/card';
import { Badge } from '@anvix/ui/components/ui/badge';
import { Phone, Mail, Briefcase, Crown, Smartphone } from 'lucide-react';
import type { Guardian } from './types';

interface GuardiansCardProps {
  guardians: Guardian[];
}

export const GuardiansCard = memo(function GuardiansCard({ guardians }: GuardiansCardProps) {
  if (guardians.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm font-semibold mb-3">Guardians</p>
        <p className="text-sm text-muted-foreground">No guardians linked to this student.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b bg-muted/30">
        <p className="text-sm font-semibold">
          Guardians
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            ({guardians.length})
          </span>
        </p>
      </div>

      <div className="divide-y">
        {guardians.map((g) => (
          <div key={g.id} className="px-6 py-4 flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-semibold text-muted-foreground">
              {g.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{g.name}</p>
                <Badge variant="outline" className="text-xs px-1.5 py-0 capitalize">
                  {g.relation}
                </Badge>
                {g.isPrimary && <Crown className="size-3.5 text-amber-500" />}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {g.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3" />
                    {g.phone}
                  </span>
                )}
                {g.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="size-3" />
                    {g.email}
                  </span>
                )}
                {g.occupation && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="size-3" />
                    {g.occupation}
                  </span>
                )}
                {g.whatsappNumber && (
                  <span className="flex items-center gap-1">
                    <Smartphone className="size-3" />
                    WA: {g.whatsappNumber}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
});
