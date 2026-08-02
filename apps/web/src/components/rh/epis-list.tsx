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
import { Plus, ShieldCheck, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createEntregaEPI, deleteEntregaEPI } from '@/actions/rh';
import { formatDate } from '@/lib/utils';
import { DocumentoAnexo } from '@/components/documentos/documento-anexo';
import { MostrarTodos } from '@/components/common/mostrar-todos';

interface ColaboradorOpt {
  id?: string;
  nombre: string | null;
  apellido1: string | null;
  apellido2: string | null;
}

interface EpiRow {
  id: string;
  colaborador_id: string;
  epi_tipo: string;
  epi_descripcion: string | null;
  cantidad: number;
  talla: string | null;
  marca: string | null;
  modelo: string | null;
  fecha_entrega: string;
  fecha_validez: string | null;
  estado: string;
  observaciones: string | null;
  colaboradores?: ColaboradorOpt | null;
}

interface Props {
  items: EpiRow[];
  colaboradores: ColaboradorOpt[];
  documentosCount?: Record<string, number>;
}

export function EpisList({ items, colaboradores, documentosCount }: Props) {
  const t = useTranslations('RH.epis');
  const tm = useTranslations('RH.messages');
  const tc = useTranslations('Common');
  const td = useTranslations('Documentos');
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [colaboradorId, setColaboradorId] = useState('');
  const [epiTipo, setEpiTipo] = useState('');
  const [epiDescripcion, setEpiDescripcion] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [talla, setTalla] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [fechaValidez, setFechaValidez] = useState('');
  const [estado, setEstado] = useState('entregado');
  const [observaciones, setObservaciones] = useState('');

  function nomeColaborador(c?: ColaboradorOpt | null) {
    if (!c) return '—';
    return [c.nombre, c.apellido1, c.apellido2].filter(Boolean).join(' ');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!colaboradorId || !epiTipo || !fechaEntrega) {
      setError(tc('required'));
      return;
    }

    setSubmitting(true);
    const result = await createEntregaEPI({
      colaborador_id: colaboradorId,
      epi_tipo: epiTipo,
      epi_descripcion: epiDescripcion || null,
      cantidad: Number(cantidad),
      talla: talla || null,
      marca: marca || null,
      modelo: modelo || null,
      fecha_entrega: fechaEntrega,
      fecha_validez: fechaValidez || null,
      estado,
      observaciones: observaciones || null,
    });

    if (!result.success) {
      setError(result.error || tm('erro'));
      setSubmitting(false);
      return;
    }

    setColaboradorId('');
    setEpiTipo('');
    setEpiDescripcion('');
    setCantidad('1');
    setTalla('');
    setMarca('');
    setModelo('');
    setFechaEntrega('');
    setFechaValidez('');
    setEstado('entregado');
    setObservaciones('');
    setShowForm(false);
    setSuccess(tm('criado'));
    setSubmitting(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    setError(null);
    const result = await deleteEntregaEPI(id);
    if (!result.success) {
      setError(result.error || tm('erro'));
      return;
    }
    router.refresh();
  }

  const estados: Record<string, string> = {
    entregado: t('estados.entregado'),
    devuelto: t('estados.devuelto'),
    sustituido: t('estados.sustituido'),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
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
                <Label htmlFor="epi-colaborador">{t('colaborador')} *</Label>
                <Select id="epi-colaborador" value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)}>
                  <option value="">—</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>{nomeColaborador(c)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="epi-tipo">{t('epiTipo')} *</Label>
                <Input id="epi-tipo" value={epiTipo} onChange={(e) => setEpiTipo(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="epi-desc">{t('epiDescripcion')}</Label>
                <Input id="epi-desc" value={epiDescripcion} onChange={(e) => setEpiDescripcion(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="epi-cant">{t('cantidad')}</Label>
                <Input id="epi-cant" type="number" min={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="epi-talla">{t('talla')}</Label>
                <Input id="epi-talla" value={talla} onChange={(e) => setTalla(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="epi-marca">{t('marca')}</Label>
                <Input id="epi-marca" value={marca} onChange={(e) => setMarca(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="epi-modelo">{t('modelo')}</Label>
                <Input id="epi-modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="epi-entrega">{t('fechaEntrega')} *</Label>
                <Input id="epi-entrega" type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="epi-validez">{t('fechaValidez')}</Label>
                <Input id="epi-validez" type="date" value={fechaValidez} onChange={(e) => setFechaValidez(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="epi-estado">{t('estado')}</Label>
                <Select id="epi-estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
                  {['entregado', 'devuelto', 'sustituido'].map((key) => (
                    <option key={key} value={key}>{t(`estados.${key}`)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label htmlFor="epi-obs">{t('observaciones')}</Label>
                <Input id="epi-obs" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
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
                <TableHead>{t('epiTipo')}</TableHead>
                <TableHead>{t('cantidad')}</TableHead>
                <TableHead>{t('talla')}</TableHead>
                <TableHead>{t('fechaEntrega')}</TableHead>
                <TableHead>{t('fechaValidez')}</TableHead>
                <TableHead>{t('estado')}</TableHead>
                <TableHead className="text-center">{td('title')}</TableHead>
                <TableHead className="text-right">{tc('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((x) => (
                <TableRow key={x.id}>
                  <TableCell className="font-medium">{nomeColaborador(x.colaboradores)}</TableCell>
                  <TableCell>{x.epi_tipo}</TableCell>
                  <TableCell>{x.cantidad}</TableCell>
                  <TableCell>{x.talla || '—'}</TableCell>
                  <TableCell>{formatDate(x.fecha_entrega)}</TableCell>
                  <TableCell>{x.fecha_validez ? formatDate(x.fecha_validez) : '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        x.estado === 'devuelto' ? 'outline'
                        : x.estado === 'sustituido' ? 'destructive'
                        : 'default'
                      }
                    >
                      {estados[x.estado] || x.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <DocumentoAnexo
                        entidade="epis"
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
          </MostrarTodos>
        )}
      </CardContent>
    </Card>
  );
}
