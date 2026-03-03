'use client';

import { memo } from 'react';
import { BarChart3, FileText, IndianRupee, Users, Banknote, Receipt } from 'lucide-react';
import type { TabKey } from './types';

const TAB_CONFIG = [
  { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
  { key: 'heads' as const, label: 'Fee Heads', icon: FileText },
  { key: 'structures' as const, label: 'Structures', icon: IndianRupee },
  { key: 'student-fees' as const, label: 'Student Fees', icon: Users },
  { key: 'collect' as const, label: 'Collect', icon: Banknote },
  { key: 'payments' as const, label: 'Payments', icon: Receipt },
];

interface FeeTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const FeeTabs = memo(function FeeTabs({ activeTab, onTabChange }: FeeTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">
      {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
});
