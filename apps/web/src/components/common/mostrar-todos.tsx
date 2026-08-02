'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MostrarTodosProps {
  count: number;
  children: ReactNode;
}

export function MostrarTodos({ count, children }: MostrarTodosProps) {
  const t = useTranslations('Common');
  const [visible, setVisible] = useState(false);

  if (visible) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Table2 className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{t('registosGuardados', { count })}</p>
      <Button variant="outline" onClick={() => setVisible(true)}>
        <Eye className="mr-2 h-4 w-4" />
        {t('mostrarTodo')}
      </Button>
    </div>
  );
}
