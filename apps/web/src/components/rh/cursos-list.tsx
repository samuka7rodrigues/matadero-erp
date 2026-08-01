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
import { Plus, GraduationCap, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createCurso, updateCursoEstado, deleteCurso } from '@/actions/rh';
import { formatDate } from '@/lib/utils';

interface ColaboradorOpt {
  id?: string;
  nombre: string | null;
  apellido1: string | null;
  apellido2: string | null;
}

interface CursoRow {
  id: string;
  colaborador_id: string;
  nombre: string;
  entidad: string | null;
  horas: number | null;
  data_inicio: string | null;
  data_fim: string | null;
  estado: string;
  observacoes: string | null;
  colaboradores?: ColaboradorOpt | null;
}

interface Props {
  items: CursoRow[];
  colaboradores: ColaboradorOpt[];
}

export function CursosList({ items, colaboradores }: Props) {
  const t = useTranslations('RH.cursos');
  const tm = useTranslations('RH.messages');
  const tc = useTranslations('Common');
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [colaboradorId, setColaboradorId] = useState('');
  const [nombre, setNombre] = useState('');
  const [entidad, setEntidad] = useState('');
  const [horas, setHoras] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [estado, setEstado] = useState('programado');
  const [observacoes, setObservacoes] = useState('');

  function nomeColaborador(c?: ColaboradorOpt | null) {
    if (!c) return '—';
    return [c.nombre, c.apellido1, c.apellido2].filter(Boolean).join(' ');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!colaboradorId || !nombre) {
      setError(tc('required'));
      return;
    }

    setSubmitting(true);
    const result = await createCurso({
      colaborador_id: colaboradorId,
      nombre,
      entidad: entidad || null,
      horas: horas === '' ? null : Number(horas),
      data_inicio: dataInicio || null,
      data_fim: dataFim || null,
      estado,
      observacoes: observacoes || null,
    });

    if (!result.success) {
      setError(result.error || tm('erro'));
      setSubmitting(false);
      return;
    }

    setColaboradorId('');
    setNombre('');
    setEntidad('');
    setHoras('');
    setDataInicio('');
    setDataFim('');
    setEstado('programado');
    setObservacoes('');
    setShowForm(false);
    setSuccess(tm('criado'));
    setSubmitting(false);
    router.refresh();
  }

  async function handleEstado(id: string, estado: string) {
    setError(null);
    const result = await updateCursoEstado(id, estado);
    if (!result.success) {
      setError(result.error || tm('erro'));
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    setError(null);
    const result = await deleteCurso(id);
    if (!result.success) {
      setError(result.error || tm('erro'));
      return;
    }
    router.refresh();
  }

  const estados: Record<string, string> = {
    programado: t('estados.programado'),
    en_curso: t('estados.en_curso'),
    completado: t('estados.completado'),
    cancelado: t('estados.cancelado'),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
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
                <Label htmlFor="c-colaborador">{t('colaborador')} *</Label>
                <Select id="c-colaborador" value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)}>
                  <option value="">—</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>{nomeColaborador(c)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="c-nombre">{t('nombre')} *</Label>
                <Input id="c-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="c-entidad">{t('entidad')}</Label>
                <Input id="c-entidad" value={entidad} onChange={(e) => setEntidad(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-horas">{t('horas')}</Label>
                <Input id="c-horas" type="number" min={0} value={horas} onChange={(e) => setHoras(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-inicio">{t('dataInicio')}</Label>
                <Input id="c-inicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-fim">{t('dataFim')}</Label>
                <Input id="c-fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-estado">{t('estado')}</Label>
                <Select id="c-estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
                  {['programado', 'en_curso', 'completado', 'cancelado'].map((key) => (
                    <option key={key} value={key}>{t(`estados.${key}`)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label htmlFor="c-obs">{t('observacoes')}</Label>
                <Input id="c-obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
              </div>
              <div className="flex items-end justify-end md:col-span-3">
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
                <TableHead>{t('nombre')}</TableHead>
                <TableHead>{t('entidad')}</TableHead>
                <TableHead>{t('horas')}</TableHead>
                <TableHead>{t('dataInicio')}</TableHead>
                <TableHead>{t('estado')}</TableHead>
                <TableHead className="text-right">{tc('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{nomeColaborador(c.colaboradores)}</TableCell>
                  <TableCell>{c.nombre}</TableCell>
                  <TableCell>{c.entidad || '—'}</TableCell>
                  <TableCell>{c.horas ?? '—'}</TableCell>
                  <TableCell>{c.data_inicio ? formatDate(c.data_inicio) : '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        c.estado === 'completado' ? 'success'
                        : c.estado === 'cancelado' ? 'destructive'
                        : c.estado === 'en_curso' ? 'default'
                        : 'outline'
                      }
                    >
                      {estados[c.estado] || c.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) handleEstado(c.id, e.target.value);
                        }}
                        className="w-32"
                      >
                        <option value="">—</option>
                        {['programado', 'en_curso', 'completado', 'cancelado'].map((key) => (
                          <option key={key} value={key}>{t(`estados.${key}`)}</option>
                        ))}
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={tc('delete')}
                        onClick={() => handleDelete(c.id)}
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
