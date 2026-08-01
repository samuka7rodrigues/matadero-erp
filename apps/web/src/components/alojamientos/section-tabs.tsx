'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabDef {
  id: string;
  label: string;
  icon?: ReactNode;
}

export function SectionTabs({ tabs, children }: { tabs: TabDef[]; children: ReactNode[] }) {
  const [active, setActive] = useState(tabs[0]?.id || '');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              active === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {children.map((child, i) => (
        <div key={tabs[i]?.id} className={tabs[i]?.id === active ? '' : 'hidden'}>
          {child}
        </div>
      ))}
    </div>
  );
}
