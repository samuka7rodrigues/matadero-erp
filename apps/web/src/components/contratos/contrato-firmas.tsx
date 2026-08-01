'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PenLine, Plus, Trash2, User, Building2, Users, AlertCircle } from 'lucide-react';
import {
  createContratoFirma,
  updateContratoFirma,
  deleteContratoFirma,
} from '@/actions/contratos';
import type { ContratoFirma } from '@/types/database';
import { useTranslations } from 'next-intl';

interface Props {
  contratoId: string;
  firmas: ContratoFirma[];
}

function FirmaIcon({ tipo }: { tipo: string }) {
  const icon =
    tipo === 'empresa' ? Building2 : tipo === 'colaborador' ? User : Users;
  const Icon = icon;
  return <Icon className="h-4 w-4" />;
}

export function ContratoFirmas({ contratoId, firmas }: Props) {
  const t = useTranslations('Contratos');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [tipo, setTipo] = useState('empresa');
  const [nombre, setNombre] = useState('');
  const [cargo, setCargo] = useState('');
  const [dni, setDni] = useState('');
  const [dataFirma, setDataFirma] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError(t('firmas.requiredNombre'));
      return;
    }

    setSubmitting(true);
    const result = await createContratoFirma(contratoId, {
      tipo,
      nombre,
      cargo: cargo || null,
      dni: dni || null,
      data_firma: dataFirma || null,
      estado: dataFirma ? 'assinado' : 'pendente',
    });

    if (!result.success) {
      setError(result.error || t('firmas.addError'));
      setSubmitting(false);
      return;
    }

    setNombre('');
    setCargo('');
    setDni('');
    setDataFirma('');
    setSubmitting(false);
    router.refresh();
  }

  async function handleMarcarAssinada(firma: ContratoFirma) {
    const data = new Date().toISOString().slice(0, 10);
    const result = await updateContratoFirma(firma.id, {
      tipo: firma.tipo,
      nombre: firma.nombre,
      cargo: firma.cargo || null,
      dni: firma.dni || null,
      data_firma: data,
      estado: 'assinado',
    });
    if (!result.success) {
      setError(result.error || t('firmas.updateError'));
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('firmas.confirmDelete'))) return;
    setError(null);
    const result = await deleteContratoFirma(id);
    if (!result.success) {
      setError(result.error || t('firmas.deleteError'));
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenLine className="h-4 w-4" />
          {t('firmas.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {firmas.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('firmas.noData')}</p>
        ) : (
          <ul className="space-y-2">
            {firmas.map((firma) => (
              <li
                key={firma.id}
                className="flex items-center gap-3 rounded-md border p-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <FirmaIcon tipo={firma.tipo} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{firma.nombre}</p>
                    <Badge variant="outline" className="shrink-0 capitalize">
                      {t(`firmas.tipos.${firma.tipo}`)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {firma.cargo && `${firma.cargo}`}
                    {firma.cargo && firma.dni ? ' · ' : ''}
                    {firma.dni && `DNI: ${firma.dni}`}
                    {firma.data_firma && ` · ${t('firmas.firmadoEm')} ${firma.data_firma}`}
                  </p>
                </div>
                {firma.estado === 'pendente' ? (
                  <Button variant="outline" size="sm" onClick={() => handleMarcarAssinada(firma)}>
                    {t('firmas.marcarAssinada')}
                  </Button>
                ) : (
                  <Badge variant="success">{t('firmas.estados.assinado')}</Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(firma.id)}
                  className="text-destructive hover:text-destructive"
                  title={t('firmas.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAdd} className="space-y-3 rounded-md border p-3">
          <p className="text-sm font-medium">{t('firmas.add')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firma-tipo">{t('firmas.tipo')}</Label>
              <Select id="firma-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="empresa">{t('firmas.tipos.empresa')}</option>
                <option value="cliente">{t('firmas.tipos.cliente')}</option>
                <option value="colaborador">{t('firmas.tipos.colaborador')}</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="firma-nombre">{t('firmas.nombre')} *</Label>
              <Input
                id="firma-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder={t('firmas.nombrePlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="firma-cargo">{t('firmas.cargo')}</Label>
              <Input
                id="firma-cargo"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder={t('firmas.cargoPlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="firma-dni">{t('firmas.dni')}</Label>
              <Input
                id="firma-dni"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="font-mono uppercase"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="firma-data">{t('firmas.dataFirma')}</Label>
              <Input
                id="firma-data"
                type="date"
                value={dataFirma}
                onChange={(e) => setDataFirma(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              <Plus className="mr-2 h-4 w-4" />
              {submitting ? tc('loading') : t('firmas.add')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
