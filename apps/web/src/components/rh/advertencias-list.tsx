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
import { Plus, AlertTriangle, Trash2, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createAdvertencia, updateAdvertenciaEstado, deleteAdvertencia } from '@/actions/rh';
import { formatDate } from '@/lib/utils';

interface ColaboradorOpt {
  id?: string;
  nombre: string | null;
  apellido1: string | null;
  apellido2: string | null;
}

interface AdvertenciaRow {
  id: string;
  colaborador_id: string;
  tipo: string;
  gravidade: string;
  motivo: string;
  data_advertencia: string;
  estado: string;
  observacoes: string | null;
  colaboradores?: ColaboradorOpt | null;
}

interface Props {
  items: AdvertenciaRow[];
  colaboradores: ColaboradorOpt[];
}

export function AdvertenciasList({ items, colaboradores }: Props) {
  const t = useTranslations('RH.advertencias');
  const tm = useTranslations('RH.messages');
  const tc = useTranslations('Common');
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [colaboradorId, setColaboradorId] = useState('');
  const [tipo, setTipo] = useState('escrita');
  const [gravidade, setGravidade] = useState('leve');
  const [motivo, setMotivo] = useState('');
  const [data, setData] = useState('');
  const [observacoes, setObservacoes] = useState('');

  function nomeColaborador(c?: ColaboradorOpt | null) {
    if (!c) return '—';
    return [c.nombre, c.apellido1, c.apellido2].filter(Boolean).join(' ');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!colaboradorId || !motivo || !data) {
      setError(tc('required'));
      return;
    }

    setSubmitting(true);
    const result = await createAdvertencia({
      colaborador_id: colaboradorId,
      tipo,
      gravidade,
      motivo,
      data_advertencia: data,
      estado: 'abierta',
      observacoes: observacoes || null,
    });

    if (!result.success) {
      setError(result.error || tm('erro'));
      setSubmitting(false);
      return;
    }

    setColaboradorId('');
    setTipo('escrita');
    setGravidade('leve');
    setMotivo('');
    setData('');
    setObservacoes('');
    setShowForm(false);
    setSuccess(tm('criado'));
    setSubmitting(false);
    router.refresh();
  }

  async function handleFechar(id: string) {
    setError(null);
    const result = await updateAdvertenciaEstado(id, 'cerrada');
    if (!result.success) {
      setError(result.error || tm('erro'));
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    setError(null);
    const result = await deleteAdvertencia(id);
    if (!result.success) {
      setError(result.error || tm('erro'));
      return;
    }
    router.refresh();
  }

  const estados: Record<string, string> = {
    abierta: t('estados.abierta'),
    cerrada: t('estados.cerrada'),
  };

  const gravedades: Record<string, string> = {
    leve: t('gravedades.leve'),
    grave: t('gravedades.grave'),
    muy_grave: t('gravedades.muy_grave'),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
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
                <Label htmlFor="ad-colaborador">{t('colaborador')} *</Label>
                <Select id="ad-colaborador" value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)}>
                  <option value="">—</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>{nomeColaborador(c)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ad-tipo">{t('tipo')}</Label>
                <Select id="ad-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {['verbal', 'escrita'].map((key) => (
                    <option key={key} value={key}>{t(`tipos.${key}`)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ad-grav">{t('gravidade')}</Label>
                <Select id="ad-grav" value={gravidade} onChange={(e) => setGravidade(e.target.value)}>
                  {['leve', 'grave', 'muy_grave'].map((key) => (
                    <option key={key} value={key}>{t(`gravedades.${key}`)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ad-data">{t('data')} *</Label>
                <Input id="ad-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label htmlFor="ad-motivo">{t('motivo')} *</Label>
                <Input id="ad-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label htmlFor="ad-obs">{t('observacoes')}</Label>
                <Input id="ad-obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
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
                <TableHead>{t('tipo')}</TableHead>
                <TableHead>{t('gravidade')}</TableHead>
                <TableHead>{t('motivo')}</TableHead>
                <TableHead>{t('data')}</TableHead>
                <TableHead>{t('estado')}</TableHead>
                <TableHead className="text-right">{tc('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{nomeColaborador(a.colaboradores)}</TableCell>
                  <TableCell>{t(`tipos.${a.tipo}`) || a.tipo}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        a.gravidade === 'muy_grave' ? 'destructive'
                        : a.gravidade === 'grave' ? 'default'
                        : 'outline'
                      }
                    >
                      {gravedades[a.gravidade] || a.gravidade}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">{a.motivo}</TableCell>
                  <TableCell>{formatDate(a.data_advertencia)}</TableCell>
                  <TableCell>
                    <Badge variant={a.estado === 'cerrada' ? 'outline' : 'destructive'}>
                      {estados[a.estado] || a.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {a.estado === 'abierta' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title={t('fechar')}
                          onClick={() => handleFechar(a.id)}
                        >
                          <Lock className="mr-1 h-4 w-4" />
                          {t('fechar')}
                        </Button>
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
        )}
      </CardContent>
    </Card>
  );
}
