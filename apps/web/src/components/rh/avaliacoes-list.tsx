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
import { Plus, ClipboardCheck, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createAvaliacao, deleteAvaliacao } from '@/actions/rh';
import { formatDate } from '@/lib/utils';
import { DocumentoAnexo } from '@/components/documentos/documento-anexo';
import { MostrarTodos } from '@/components/common/mostrar-todos';

interface ColaboradorOpt {
  id?: string;
  nombre: string | null;
  apellido1: string | null;
  apellido2: string | null;
}

interface AvaliacaoRow {
  id: string;
  colaborador_id: string;
  tipo: string;
  periodo: string | null;
  data_avaliacao: string;
  pontuacao: number | null;
  resultados: string | null;
  objetivos: string | null;
  avaliador_id: string | null;
  observacoes: string | null;
  colaboradores?: ColaboradorOpt | null;
  avaliadores?: ColaboradorOpt | null;
}

interface Props {
  items: AvaliacaoRow[];
  colaboradores: ColaboradorOpt[];
  documentosCount?: Record<string, number>;
}

export function AvaliacoesList({ items, colaboradores, documentosCount }: Props) {
  const t = useTranslations('RH.avaliacoes');
  const tm = useTranslations('RH.messages');
  const tc = useTranslations('Common');
  const td = useTranslations('Documentos');
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [colaboradorId, setColaboradorId] = useState('');
  const [tipo, setTipo] = useState('anual');
  const [periodo, setPeriodo] = useState('');
  const [data, setData] = useState('');
  const [pontuacao, setPontuacao] = useState('');
  const [resultados, setResultados] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [avaliadorId, setAvaliadorId] = useState('');
  const [observacoes, setObservacoes] = useState('');

  function nomeColaborador(c?: ColaboradorOpt | null) {
    if (!c) return '—';
    return [c.nombre, c.apellido1, c.apellido2].filter(Boolean).join(' ');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!colaboradorId || !data) {
      setError(tc('required'));
      return;
    }

    setSubmitting(true);
    const result = await createAvaliacao({
      colaborador_id: colaboradorId,
      tipo,
      periodo: periodo || null,
      data_avaliacao: data,
      pontuacao: pontuacao === '' ? null : Number(pontuacao),
      resultados: resultados || null,
      objetivos: objetivos || null,
      avaliador_id: avaliadorId || null,
      observacoes: observacoes || null,
    });

    if (!result.success) {
      setError(result.error || tm('erro'));
      setSubmitting(false);
      return;
    }

    setColaboradorId('');
    setTipo('anual');
    setPeriodo('');
    setData('');
    setPontuacao('');
    setResultados('');
    setObjetivos('');
    setAvaliadorId('');
    setObservacoes('');
    setShowForm(false);
    setSuccess(tm('criado'));
    setSubmitting(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    setError(null);
    const result = await deleteAvaliacao(id);
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
            <ClipboardCheck className="h-4 w-4" />
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
                <Label htmlFor="av-colaborador">{t('colaborador')} *</Label>
                <Select id="av-colaborador" value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)}>
                  <option value="">—</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>{nomeColaborador(c)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="av-tipo">{t('tipo')}</Label>
                <Select id="av-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {['inicial', 'seguimiento', 'anual', 'salida'].map((key) => (
                    <option key={key} value={key}>{t(`tipos.${key}`)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="av-periodo">{t('periodo')}</Label>
                <Input id="av-periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="av-data">{t('data')} *</Label>
                <Input id="av-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="av-pont">{t('pontuacao')}</Label>
                <Input
                  id="av-pont"
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={pontuacao}
                  onChange={(e) => setPontuacao(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="av-avaliador">{t('avaliador')}</Label>
                <Select id="av-avaliador" value={avaliadorId} onChange={(e) => setAvaliadorId(e.target.value)}>
                  <option value="">—</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>{nomeColaborador(c)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label htmlFor="av-res">{t('resultados')}</Label>
                <Input id="av-res" value={resultados} onChange={(e) => setResultados(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label htmlFor="av-obj">{t('objetivos')}</Label>
                <Input id="av-obj" value={objetivos} onChange={(e) => setObjetivos(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-4">
                <Label htmlFor="av-obs">{t('observacoes')}</Label>
                <Input id="av-obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
              </div>
              <div className="flex items-end justify-end md:col-span-2">
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
                <TableHead>{t('periodo')}</TableHead>
                <TableHead>{t('data')}</TableHead>
                <TableHead>{t('pontuacao')}</TableHead>
                <TableHead>{t('avaliador')}</TableHead>
                <TableHead className="text-center">{td('title')}</TableHead>
                <TableHead className="text-right">{tc('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{nomeColaborador(a.colaboradores)}</TableCell>
                  <TableCell>{t(`tipos.${a.tipo}`) || a.tipo}</TableCell>
                  <TableCell>{a.periodo || '—'}</TableCell>
                  <TableCell>{formatDate(a.data_avaliacao)}</TableCell>
                  <TableCell>
                    {a.pontuacao != null ? (
                      <Badge
                        variant={
                          a.pontuacao >= 7 ? 'success'
                          : a.pontuacao >= 4 ? 'default'
                          : 'destructive'
                        }
                      >
                        {a.pontuacao}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{nomeColaborador(a.avaliadores)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <DocumentoAnexo
                        entidade="avaliacoes"
                        entidadeId={a.id}
                        referencia={nomeColaborador(a.colaboradores)}
                        count={documentosCount?.[a.id] || 0}
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
