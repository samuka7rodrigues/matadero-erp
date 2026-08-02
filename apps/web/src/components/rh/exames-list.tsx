'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, HeartPulse, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createExameMedico, deleteExameMedico } from '@/actions/rh';
import { formatDate } from '@/lib/utils';
import { DocumentoAnexo } from '@/components/documentos/documento-anexo';

interface ColaboradorOpt {
  id?: string;
  nombre: string | null;
  apellido1: string | null;
  apellido2: string | null;
}

interface ExameRow {
  id: string;
  colaborador_id: string;
  fecha_examen: string;
  fecha_validez: string;
  aptidao: string;
  restricciones: string | null;
  observaciones: string | null;
  medico: string | null;
  centro_medico: string | null;
  colaboradores?: ColaboradorOpt | null;
}

interface Props {
  items: ExameRow[];
  colaboradores: ColaboradorOpt[];
  documentosCount?: Record<string, number>;
}

export function ExamesList({ items, colaboradores, documentosCount }: Props) {
  const t = useTranslations('RH.exames');
  const tm = useTranslations('RH.messages');
  const tc = useTranslations('Common');
  const td = useTranslations('Documentos');
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [colaboradorId, setColaboradorId] = useState('');
  const [fechaExamen, setFechaExamen] = useState('');
  const [fechaValidez, setFechaValidez] = useState('');
  const [aptidao, setAptidao] = useState('apto');
  const [restricciones, setRestricciones] = useState('');
  const [medico, setMedico] = useState('');
  const [centroMedico, setCentroMedico] = useState('');
  const [observaciones, setObservaciones] = useState('');

  function nomeColaborador(c?: ColaboradorOpt | null) {
    if (!c) return '—';
    return [c.nombre, c.apellido1, c.apellido2].filter(Boolean).join(' ');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!colaboradorId || !fechaExamen || !fechaValidez) {
      setError(tc('required'));
      return;
    }

    setSubmitting(true);
    const result = await createExameMedico({
      colaborador_id: colaboradorId,
      fecha_examen: fechaExamen,
      fecha_validez: fechaValidez,
      aptidao,
      restricciones: restricciones || null,
      observaciones: observaciones || null,
      medico: medico || null,
      centro_medico: centroMedico || null,
    });

    if (!result.success) {
      setError(result.error || tm('erro'));
      setSubmitting(false);
      return;
    }

    setColaboradorId('');
    setFechaExamen('');
    setFechaValidez('');
    setAptidao('apto');
    setRestricciones('');
    setMedico('');
    setCentroMedico('');
    setObservaciones('');
    setShowForm(false);
    setSuccess(tm('criado'));
    setSubmitting(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    setError(null);
    const result = await deleteExameMedico(id);
    if (!result.success) {
      setError(result.error || tm('erro'));
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4" />
            {t('title')}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowForm((s) => !s)}>
            <Plus className="mr-1 h-4 w-4" />
            {t('new')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-500/15 p-3 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="space-y-3 rounded-md border p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="e-colaborador">{t('colaborador')} *</Label>
                <Select id="e-colaborador" value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)}>
                  <option value="">—</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>{nomeColaborador(c)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-examen">{t('fechaExamen')} *</Label>
                <Input id="e-examen" type="date" value={fechaExamen} onChange={(e) => setFechaExamen(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-validez">{t('fechaValidez')} *</Label>
                <Input id="e-validez" type="date" value={fechaValidez} onChange={(e) => setFechaValidez(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-aptidao">{t('aptidao')}</Label>
                <Select id="e-aptidao" value={aptidao} onChange={(e) => setAptidao(e.target.value)}>
                  {['apto', 'no_apto', 'apto_con_restricciones'].map((key) => (
                    <option key={key} value={key}>{t(`aptidoes.${key}`)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label htmlFor="e-restricciones">{t('restricciones')}</Label>
                <Input id="e-restricciones" value={restricciones} onChange={(e) => setRestricciones(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label htmlFor="e-medico">{t('medico')}</Label>
                <Input id="e-medico" value={medico} onChange={(e) => setMedico(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label htmlFor="e-centro">{t('centroMedico')}</Label>
                <Input id="e-centro" value={centroMedico} onChange={(e) => setCentroMedico(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label htmlFor="e-obs">{t('observaciones')}</Label>
                <Input id="e-obs" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
              </div>
              <div className="flex items-end justify-end md:col-span-6">
                <Button type="submit" disabled={submitting}>
                  {submitting ? tc('loading') : tc('save')}
                </Button>
              </div>
            </div>
          </form>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t('noData')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('colaborador')}</TableHead>
                <TableHead>{t('fechaExamen')}</TableHead>
                <TableHead>{t('fechaValidez')}</TableHead>
                <TableHead>{t('aptidao')}</TableHead>
                <TableHead>{t('centroMedico')}</TableHead>
                <TableHead className="text-center">{td('title')}</TableHead>
                <TableHead className="text-right">{tc('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((x) => (
                <TableRow key={x.id}>
                  <TableCell className="font-medium">{nomeColaborador(x.colaboradores)}</TableCell>
                  <TableCell>{formatDate(x.fecha_examen)}</TableCell>
                  <TableCell>{formatDate(x.fecha_validez)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        x.aptidao === 'apto' ? 'success'
                        : x.aptidao === 'no_apto' ? 'destructive'
                        : 'default'
                      }
                    >
                      {t(`aptidoes.${x.aptidao}`) || x.aptidao}
                    </Badge>
                  </TableCell>
                  <TableCell>{x.centro_medico || '—'}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <DocumentoAnexo
                        entidade="exames"
                        entidadeId={x.id}
                        referencia={nomeColaborador(x.colaboradores)}
                        count={documentosCount?.[x.id] || 0}
                        iconOnly
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={tc('delete')}
                        onClick={() => handleDelete(x.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
