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
import { Plus, CalendarDays, Check, X, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createFerias, updateFeriasEstado, deleteFerias } from '@/actions/rh';
import { formatDate } from '@/lib/utils';

interface ColaboradorOpt {
  id?: string;
  nombre: string | null;
  apellido1: string | null;
  apellido2: string | null;
}

interface FeriasRow {
  id: string;
  colaborador_id: string;
  data_inicio: string;
  data_fim: string;
  dias: number;
  tipo: string;
  estado: string;
  solicitado_em: string;
  observacoes: string | null;
  colaboradores?: ColaboradorOpt | null;
}

interface Props {
  items: FeriasRow[];
  colaboradores: ColaboradorOpt[];
}

export function FeriasList({ items, colaboradores }: Props) {
  const t = useTranslations('RH.ferias');
  const tm = useTranslations('RH.messages');
  const tc = useTranslations('Common');
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [colaboradorId, setColaboradorId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipo, setTipo] = useState('vacaciones');
  const [observacoes, setObservacoes] = useState('');

  function nomeColaborador(c?: ColaboradorOpt | null) {
    if (!c) return '—';
    return [c.nombre, c.apellido1, c.apellido2].filter(Boolean).join(' ');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!colaboradorId || !dataInicio || !dataFim) {
      setError('Preencha os campos obrigatórios');
      return;
    }

    setSubmitting(true);
    const result = await createFerias({
      colaborador_id: colaboradorId,
      data_inicio: dataInicio,
      data_fim: dataFim,
      tipo,
      estado: 'pendente',
      observacoes: observacoes || null,
    });

    if (!result.success) {
      setError(result.error || tm('erro'));
      setSubmitting(false);
      return;
    }

    setColaboradorId('');
    setDataInicio('');
    setDataFim('');
    setTipo('vacaciones');
    setObservacoes('');
    setShowForm(false);
    setSuccess(tm('criado'));
    setSubmitting(false);
    router.refresh();
  }

  async function handleEstado(id: string, estado: string) {
    setError(null);
    const result = await updateFeriasEstado(id, estado);
    if (!result.success) {
      setError(result.error || 'Erro ao atualizar');
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    setError(null);
    const result = await deleteFerias(id);
    if (!result.success) {
      setError(result.error || 'Erro ao eliminar');
      return;
    }
    router.refresh();
  }

  const estados: Record<string, string> = {
    pendente: t('estados.pendente'),
    aprovado: t('estados.aprovado'),
    rejeitado: t('estados.rejeitado'),
    cancelado: t('estados.cancelado'),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="f-colaborador">{t('colaborador')} *</Label>
                <Select id="f-colaborador" value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)}>
                  <option value="">—</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>{nomeColaborador(c)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-inicio">{t('dataInicio')} *</Label>
                <Input id="f-inicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-fim">{t('dataFim')} *</Label>
                <Input id="f-fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-tipo">{t('tipo')}</Label>
                <Select id="f-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {['vacaciones', 'asuntos_propios', 'boda', 'nacimiento', 'mudanza'].map((key) => (
                    <option key={key} value={key}>{t(`tipos.${key}`)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-4">
                <Label htmlFor="f-obs">{t('observacoes')}</Label>
                <Input id="f-obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
              </div>
              <div className="flex items-end justify-end">
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
                <TableHead>{t('dataInicio')}</TableHead>
                <TableHead>{t('dataFim')}</TableHead>
                <TableHead>{t('dias')}</TableHead>
                <TableHead>{t('tipo')}</TableHead>
                <TableHead>{t('estado')}</TableHead>
                <TableHead className="text-right">{tc('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{nomeColaborador(f.colaboradores)}</TableCell>
                  <TableCell>{formatDate(f.data_inicio)}</TableCell>
                  <TableCell>{formatDate(f.data_fim)}</TableCell>
                  <TableCell>{f.dias}</TableCell>
                  <TableCell>{t(`tipos.${f.tipo}`) || f.tipo}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        f.estado === 'aprovado' ? 'success'
                        : f.estado === 'rejeitado' ? 'destructive'
                        : f.estado === 'cancelado' ? 'outline'
                        : 'default'
                      }
                    >
                      {estados[f.estado] || f.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {f.estado === 'pendente' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t('aprovar')}
                            onClick={() => handleEstado(f.id, 'aprovado')}
                          >
                            <Check className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t('rejeitar')}
                            onClick={() => handleEstado(f.id, 'rejeitado')}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title={tc('delete')}
                        onClick={() => handleDelete(f.id)}
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
