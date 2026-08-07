'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, FileDown } from 'lucide-react';
import { deleteEmpresa } from '@/actions/empresa';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/config';

export function EmpresaActions({ id }: { id: string }) {
  const t = useTranslations('Empresa');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!window.confirm(t('messages.confirmDelete'))) return;
    startTransition(async () => {
      const result = await deleteEmpresa(id);
      if (!result.success) {
        setError(result.error || 'Erro ao eliminar');
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {error && <span className="text-xs text-destructive mr-2">{error}</span>}
      <Button variant="ghost" size="icon" asChild title="Exportar PDF">
        <Link href={`/empresas/${id}/print`}>
          <FileDown className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" asChild title={t('actions.edit')}>
        <Link href={`/empresas/${id}/edit`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title={t('actions.delete')}
        disabled={isPending}
        onClick={handleDelete}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
