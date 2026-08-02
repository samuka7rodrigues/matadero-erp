'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Award, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createCertificado, deleteCertificado } from '@/actions/rh';
import { formatDate } from '@/lib/utils';
import { MostrarTodos } from '@/components/common/mostrar-todos';

interface ColaboradorOpt {
  id?: string;
  nombre: string | null;
  apellido1: string | null;
  apellido2: string | null;
}

interface CertificadoRow {
  id: string;
  colaborador_id: string;
  curso_id: string | null;
  nombre: string;
  entidad: string | null;
  tipo: string;
  numero: string | null;
  data_emision: string;
  data_validez: string | null;
  observacoes: string | null;
  colaboradores?: ColaboradorOpt | null;
}

interface Props {
  items: CertificadoRow[];
  colaboradores: ColaboradorOpt[];
}

export function CertificadosList({ items, colaboradores }: Props) {
  const t = useTranslations('RH.certificados');
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
  const [tipo, setTipo] = useState('formacion');
  const [numero, setNumero] = useState('');
  const [dataEmision, setDataEmision] = useState('');
  const [dataValidez, setDataValidez] = useState('');
  const [observacoes, setObservacoes] = useState('');

  function nomeColaborador(c?: ColaboradorOpt | null) {
    if (!c) return '—';
    return [c.nombre, c.apellido1, c.apellido2].filter(Boolean).join(' ');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!colaboradorId || !nombre || !dataEmision) {
      setError(tc('required'));
      return;
    }

    setSubmitting(true);
    const result = await createCertificado({
      colaborador_id: colaboradorId,
      curso_id: null,
      nombre,
      entidad: entidad || null,
      tipo,
      numero: numero || null,
      data_emision: dataEmision,
      data_validez: dataValidez || null,
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
    setTipo('formacion');
    setNumero('');
    setDataEmision('');
    setDataValidez('');
    setObservacoes('');
    setShowForm(false);
    setSuccess(tm('criado'));
    setSubmitting(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    setError(null);
    const result = await deleteCertificado(id);
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
            <Award className="h-4 w-4" />
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
                <Label htmlFor="ce-colaborador">{t('colaborador')} *</Label>
                <Select id="ce-colaborador" value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)}>
                  <option value="">—</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>{nomeColaborador(c)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="ce-nombre">{t('nombre')} *</Label>
                <Input id="ce-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="ce-entidad">{t('entidad')}</Label>
                <Input id="ce-entidad" value={entidad} onChange={(e) => setEntidad(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ce-tipo">{t('tipo')}</Label>
                <Select id="ce-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {['formacion', 'seguridad', 'manipulacion', 'otro'].map((key) => (
                    <option key={key} value={key}>{t(`tipos.${key}`)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ce-numero">{t('numero')}</Label>
                <Input id="ce-numero" value={numero} onChange={(e) => setNumero(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ce-emision">{t('dataEmision')} *</Label>
                <Input id="ce-emision" type="date" value={dataEmision} onChange={(e) => setDataEmision(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ce-validez">{t('dataValidez')}</Label>
                <Input id="ce-validez" type="date" value={dataValidez} onChange={(e) => setDataValidez(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label htmlFor="ce-obs">{t('observacoes')}</Label>
                <Input id="ce-obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
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
          <MostrarTodos count={items.length}>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('colaborador')}</TableHead>
                <TableHead>{t('nombre')}</TableHead>
                <TableHead>{t('entidad')}</TableHead>
                <TableHead>{t('tipo')}</TableHead>
                <TableHead>{t('numero')}</TableHead>
                <TableHead>{t('dataEmision')}</TableHead>
                <TableHead>{t('dataValidez')}</TableHead>
                <TableHead className="text-right">{tc('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{nomeColaborador(c.colaboradores)}</TableCell>
                  <TableCell>{c.nombre}</TableCell>
                  <TableCell>{c.entidad || '—'}</TableCell>
                  <TableCell>{t(`tipos.${c.tipo}`) || c.tipo}</TableCell>
                  <TableCell>{c.numero || '—'}</TableCell>
                  <TableCell>{formatDate(c.data_emision)}</TableCell>
                  <TableCell>{c.data_validez ? formatDate(c.data_validez) : '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
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
          </MostrarTodos>
        )}
      </CardContent>
    </Card>
  );
}
