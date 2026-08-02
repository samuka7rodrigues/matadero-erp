'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { FileSpreadsheet, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';

export interface HoraExtraExportRow {
  id: string;
  colaborador: string;
  data: string;
  horas: number;
  tipo: string;
  estado: string;
  importe: number;
}

interface Props {
  rows: HoraExtraExportRow[];
}

function fileName() {
  const d = new Date();
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `horas-extras-${iso}.xlsx`;
}

export function ExportarHorasExtras({ rows }: Props) {
  const t = useTranslations('Finanzas');
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function buildWorkbook() {
    const XLSX = await import('xlsx');
    const data = rows.map((r) => ({
      [t('horasExtras.colaborador')]: r.colaborador,
      [t('horasExtras.data')]: formatDate(r.data, locale),
      [t('horasExtras.horas')]: r.horas,
      [t('horasExtras.tipo')]: t(`horasExtras.tipos.${r.tipo}`) || r.tipo,
      [t('horasExtras.estado')]: t(`horasExtras.estados.${r.estado}`) || r.estado,
      [t('horasExtras.importe')]: r.importe,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Horas Extras');
    return { XLSX, wb };
  }

  async function handleExportar() {
    setBusy(true);
    setFeedback(null);
    try {
      const { XLSX, wb } = await buildWorkbook();
      XLSX.writeFile(wb, fileName());
      setFeedback(t('horasExtras.exportOk'));
    } catch {
      setFeedback(t('horasExtras.exportError'));
    } finally {
      setBusy(false);
    }
  }

  async function handleWhatsapp() {
    setBusy(true);
    setFeedback(null);
    try {
      const { XLSX, wb } = await buildWorkbook();
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
      const file = new File([out], fileName(), {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const total = rows.reduce((acc, r) => acc + Number(r.importe), 0);
      const texto = `${t('horasExtras.title')}\n${t('Common.total')}: ${rows.length}\n${t('horasExtras.importe')}: ${formatCurrency(total, locale)}`;

      const canShareFile = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
      if (canShareFile) {
        await navigator.share({ files: [file], title: texto, text: texto });
      } else {
        XLSX.writeFile(wb, fileName());
        const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
        window.open(url, '_blank');
      }
      setFeedback(t('horasExtras.exportOk'));
    } catch {
      setFeedback(t('horasExtras.exportError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleExportar} disabled={busy}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {t('horasExtras.exportar')}
        </Button>
        <Button variant="outline" onClick={handleWhatsapp} disabled={busy}>
          <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" />
          {t('horasExtras.partilharWhatsapp')}
        </Button>
      </div>
      {feedback && <p className="text-xs text-muted-foreground">{feedback}</p>}
    </div>
  );
}
