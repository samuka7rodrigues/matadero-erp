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
import { Plus, CalendarX, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createAusencia, updateAusenciaEstado, deleteAusencia } from '@/actions/rh';
import { formatDate } from '@/lib/utils';
import { MostrarTodos } from '@/components/common/mostrar-todos';

interface ColaboradorOpt {
  id?: string;
  nombre: string | null;
  apellido1: string | null;
  apellido2: string | null;
}

interface AusenciaRow {
  id: string;
  colaborador_id: string;
  tipo: string;
  data_inicio: string;
  data_fim: string | null;
  dias: number | null;
  motivo: string | null;
  justificada: boolean;
  estado: string;
  observacoes: string | null;
  colaboradores?: ColaboradorOpt | null;
}

interface Props {
  items: AusenciaRow[];
  colaboradores: ColaboradorOpt[];
}

export function AusenciasList({ items, colaboradores }: Props) {
  const t = useTranslations('RH.ausencias');
  const tm = useTranslations('RH.messages');
  const tc = useTranslations('Common');
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [colaboradorId, setColaboradorId] = useState('');
  const [tipo, setTipo] = useState('ausencia');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observacoes, setObservacoes] = useState('');

  function nomeColaborador(c?: ColaboradorOpt | null) {
    if (!c) return '—';
    return [c.nombre, c.apellido1, c.apellido2].filter(Boolean).join(' ');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!colaboradorId || !dataInicio) {
      setError(tc('required'));
      return;
    }

    setSubmitting(true);
    const result = await createAusencia({
      colaborador_id: colaboradorId,
      tipo,
      data_inicio: dataInicio,
      data_fim: dataFim || null,
      motivo: motivo || null,
      justificada: false,
      estado: 'pendiente',
      observacoes: observacoes || null,
    });

    if (!result.success) {
      setError(result.error || tm('erro'));
      setSubmitting(false);
      return;
    }

    setColaboradorId('');
    setTipo('ausencia');
    setDataInicio('');
    setDataFim('');
    setMotivo('');
    setObservacoes('');
    setShowForm(false);
    setSuccess(tm('criado'));
    setSubmitting(false);
    router.refresh();
  }

  async function handleEstado(id: string, estado: string) {
    setError(null);
    const result = await updateAusenciaEstado(id, estado);
    if (!result.success) {
      setError(result.error || tm('erro'));
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    setError(null);
    const result = await deleteAusencia(id);
    if (!result.success) {
      setError(result.error || tm('erro'));
      return;
    }
    router.refresh();
  }

  const estados: Record<string, string> = {
    pendiente: t('estados.pendiente'),
    justificada: t('estados.justificada'),
    injustificada: t('estados.injustificada'),
    cancelada: t('estados.cancelada'),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarX className="h-4 w-4" />
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
                <Label htmlFor="a-colaborador">{t('colaborador')} *</Label>
                <Select id="a-colaborador" value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)}>
                  <option value="">—</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>{nomeColaborador(c)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-tipo">{t('tipo')}</Label>
                <Select id="a-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {['ausencia', 'baixa_medica', 'permiso', 'otra'].map((key) => (
                    <option key={key} value={key}>{t(`tipos.${key}`)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-inicio">{t('dataInicio')} *</Label>
                <Input id="a-inicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-fim">{t('dataFim')}</Label>
                <Input id="a-fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label htmlFor="a-motivo">{t('motivo')}</Label>
                <Input id="a-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label htmlFor="a-obs">{t('observacoes')}</Label>
                <Input id="a-obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
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
          <MostrarTodos count={items.length}>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('colaborador')}</TableHead>
                <TableHead>{t('tipo')}</TableHead>
                <TableHead>{t('dataInicio')}</TableHead>
                <TableHead>{t('dataFim')}</TableHead>
                <TableHead>{t('dias')}</TableHead>
                <TableHead>{t('justificada')}</TableHead>
                <TableHead>{t('estado')}</TableHead>
                <TableHead className="text-right">{tc('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{nomeColaborador(a.colaboradores)}</TableCell>
                  <TableCell>{t(`tipos.${a.tipo}`) || a.tipo}</TableCell>
                  <TableCell>{formatDate(a.data_inicio)}</TableCell>
                  <TableCell>{a.data_fim ? formatDate(a.data_fim) : '—'}</TableCell>
                  <TableCell>{a.dias ?? '—'}</TableCell>
                  <TableCell>{a.justificada ? t('sim') : t('nao')}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        a.estado === 'justificada' ? 'success'
                        : a.estado === 'injustificada' ? 'destructive'
                        : a.estado === 'cancelada' ? 'outline'
                        : 'default'
                      }
                    >
                      {estados[a.estado] || a.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {a.estado === 'pendiente' && (
                        <Select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) handleEstado(a.id, e.target.value);
                          }}
                          className="w-32"
                        >
                          <option value="">—</option>
                          <option value="justificada">{t('estados.justificada')}</option>
                          <option value="injustificada">{t('estados.injustificada')}</option>
                          <option value="cancelada">{t('estados.cancelada')}</option>
                        </Select>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title={tc('delete')}
                        onClick={() => handleDelete(a.id)}
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
          </MostrarTodos>
        )}
      </CardContent>
    </Card>
  );
}
