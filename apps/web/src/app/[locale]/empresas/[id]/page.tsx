import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/config';
import { getEmpresaComLogotipo } from '@/actions/empresa';
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  MapPin,
  Globe,
  Building2,
  Landmark,
  FileDown,
} from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EmpresaDetalhePage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('Empresa');
  const e = await getEmpresaComLogotipo(id);

  if (!e) notFound();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/empresas">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{e.nombre}</h1>
              <p className="text-muted-foreground">
                {e.nombre_comercial || (e.cif_nif ? `CIF/NIF ${e.cif_nif}` : '')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:ml-auto">
            {e.iva != null && <Badge variant="outline">IVA {e.iva}%</Badge>}
            <Button variant="outline" asChild>
              <Link href={`/empresas/${id}/print`}>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar PDF
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/empresas/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                {t('actions.edit')}
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Identificação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t('sections.identificacion')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('fields.nombre')}</span>
                <span className="font-medium">{e.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('fields.nombreComercial')}</span>
                <span>{e.nombre_comercial || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('fields.cifNif')}</span>
                <span className="font-mono">{e.cif_nif || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('fields.iva')}</span>
                <span>{e.iva != null ? `${e.iva}%` : '—'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Logotipo */}
          {e.logoUrl && (
            <Card>
              <CardHeader>
                <CardTitle>{t('fields.logotipo')}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={e.logoUrl}
                  alt={e.nombre}
                  className="max-h-32 max-w-full rounded-md object-contain"
                />
              </CardContent>
            </Card>
          )}

          {/* Contacto */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sections.contacto')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {e.direccion && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>
                    {e.direccion}
                    {e.codigo_postal && `, ${e.codigo_postal}`}
                    {e.ciudad && ` ${e.ciudad}`}
                    {e.pais && ` (${e.pais})`}
                  </span>
                </div>
              )}
              {e.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{e.telefono}</span>
                </div>
              )}
              {e.correo && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{e.correo}</span>
                </div>
              )}
              {e.web && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={e.web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {e.web}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Banca */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                {t('sections.banca')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('fields.banco')}</span>
                <span>{e.banco || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('fields.iban')}</span>
                <span className="font-mono text-xs">{e.iban || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('fields.swift')}</span>
                <span className="font-mono text-xs">{e.swift || '—'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Responsáveis */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t('sections.responsables')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">{t('fields.responsableDireccion')}</div>
                  <div className="mt-1 font-medium">{e.responsable_direccion || '—'}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">{t('fields.responsableRrhh')}</div>
                  <div className="mt-1 font-medium">{e.responsable_rrhh || '—'}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">{t('fields.responsableFinanzas')}</div>
                  <div className="mt-1 font-medium">{e.responsable_finanzas || '—'}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">{t('fields.responsableOperaciones')}</div>
                  <div className="mt-1 font-medium">{e.responsable_operaciones || '—'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
