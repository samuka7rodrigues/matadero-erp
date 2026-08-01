'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  id: string;
  confirmMessage: string;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function DeleteButton({ id, confirmMessage, onDelete }: Props) {
  const t = useTranslations('Common');
  const te = useTranslations('Errors');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!window.confirm(confirmMessage)) return;
    startTransition(async () => {
      const result = await onDelete(id);
      if (!result.success) {
        setError(result.error || te('generic'));
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <Button
        variant="ghost"
        size="icon"
        title={t('delete')}
        disabled={isPending}
        onClick={handleDelete}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
