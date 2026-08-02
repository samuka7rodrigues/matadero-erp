import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/config';
import {
  getAlojamiento,
  listarHabitaciones,
  listarOcupaciones,
  listarColaboradoresAtivos,
} from '@/actions/alojamiento';
import {
  listarInventario,
  listarFotografias,
  listarIncidencias,
  listarContratos,
  listarConsumos,
} from '@/actions/alojamiento-fase2';
import { listDocumentos } from '@/actions/documentos';
import { SectionTabs } from '@/components/alojamientos/section-tabs';
import { HabitacionesSection } from '@/components/alojamientos/habitaciones-section';
import { OcupacionSection } from '@/components/alojamientos/ocupacion-section';
import { InventarioSection } from '@/components/alojamientos/inventario-section';
import { FotografiasSection } from '@/components/alojamientos/fotografias-section';
import { IncidenciasSection } from '@/components/alojamientos/incidencias-section';
import { ContratosSection } from '@/components/alojamientos/contratos-section';
import { ConsumosSection } from '@/components/alojamientos/consumos-section';
import { DocumentosSecao } from '@/components/documentos/documentos-secao';
import {
  ArrowLeft,
  Pencil,
  Home,
  MapPin,
  Euro,
  DoorOpen,
  Users,
  Boxes,
  Camera,
  TriangleAlert,
  FileSignature,
  Gauge,
  FolderOpen,
} from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AlojamientoDetalhePage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('Alojamiento');

  const [
    a,
    { data: habitaciones },
    { data: ocupaciones },
    { data: colaboradores },
    { data: inventario },
    { data: fotografias },
    { data: incidencias },
    { data: contratos },
    { data: consumos },
    { data: documentos },
  ] = await Promise.all([
    getAlojamiento(id),
    listarHabitaciones(id),
    listarOcupaciones(id),
    listarColaboradoresAtivos(),
    listarInventario(id),
    listarFotografias(id),
    listarIncidencias(id),
    listarContratos(id),
    listarConsumos(id),
    listDocumentos('alojamientos', id),
  ]);

  if (!a) notFound();

  const ocupadas = habitaciones.filter((h) => h.estado === 'ocupada').length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/alojamientos">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{a.nombre}</h1>
              <p className="text-muted-foreground">
                {a.codigo ? `${a.codigo} · ` : ''}
                {a.tipo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:ml-auto">
            <Badge variant={a.estado === 'ativo' ? 'success' : 'secondary'}>
              {t(`estados.${a.estado}`)}
            </Badge>
            <Button variant="outline" asChild>
              <Link href={`/alojamientos/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                {t('actions.edit')}
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Vivienda */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Vivienda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(a.direccion || a.ciudad) && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>
                    {a.direccion}
                    {a.codigo_postal && `, ${a.codigo_postal}`}
                    {a.ciudad && ` ${a.ciudad}`}
                    {a.pais && ` (${a.pais})`}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('fields.capacidad')}</span>
                <span className="font-medium">{a.capacidad ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('fields.rendaMensal')}</span>
                <span className="font-medium">
                  {a.renda_mensal != null ? `${a.renda_mensal.toLocaleString()} €` : '—'}
                </span>
              </div>
              {a.responsable && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('fields.responsable')}</span>
                  <span className="font-medium">{a.responsable}</span>
                </div>
              )}
              {a.observacoes && (
                <div className="rounded-md bg-muted p-3 text-sm">{a.observacoes}</div>
              )}
            </CardContent>
          </Card>

          {/* Resumo ocupação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DoorOpen className="h-4 w-4" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Habitaciones</div>
                <div className="mt-1 text-2xl font-bold">{habitaciones.length}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Ocupadas</div>
                <div className="mt-1 text-2xl font-bold">{ocupadas}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Ocupações ativas</div>
                <div className="mt-1 text-2xl font-bold">
                  {ocupaciones.filter((o) => o.estado === 'ativa').length}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Renda mensal</div>
                <div className="mt-1 flex items-center gap-1 text-2xl font-bold">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  {a.renda_mensal?.toLocaleString() ?? 0}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <SectionTabs
          tabs={[
            { id: 'habitaciones', label: t('habitaciones.title'), icon: <DoorOpen className="h-4 w-4" /> },
            { id: 'ocupacion', label: t('ocupacion.title'), icon: <Users className="h-4 w-4" /> },
            { id: 'inventario', label: t('inventario.title'), icon: <Boxes className="h-4 w-4" /> },
            { id: 'fotografias', label: t('fotografias.title'), icon: <Camera className="h-4 w-4" /> },
            { id: 'incidencias', label: t('incidencias.title'), icon: <TriangleAlert className="h-4 w-4" /> },
            { id: 'contratos', label: t('contratos.title'), icon: <FileSignature className="h-4 w-4" /> },
            { id: 'consumos', label: t('consumos.title'), icon: <Gauge className="h-4 w-4" /> },
            { id: 'documentos', label: t('documentos.title'), icon: <FolderOpen className="h-4 w-4" /> },
          ]}
        >
          <HabitacionesSection alojamientoId={id} habitaciones={habitaciones} />
          <OcupacionSection
            alojamientoId={id}
            ocupaciones={ocupaciones}
            habitaciones={habitaciones}
            colaboradores={colaboradores}
          />
          <InventarioSection alojamientoId={id} inventario={inventario} habitaciones={habitaciones} />
          <FotografiasSection alojamientoId={id} fotografias={fotografias} habitaciones={habitaciones} />
          <IncidenciasSection alojamientoId={id} incidencias={incidencias} habitaciones={habitaciones} />
          <ContratosSection
            alojamientoId={id}
            contratos={contratos}
            habitaciones={habitaciones}
            colaboradores={colaboradores}
          />
          <ConsumosSection alojamientoId={id} consumos={consumos} />
          <DocumentosSecao entidade="alojamientos" entidadeId={id} referencia={a.nombre} items={documentos} />
        </SectionTabs>
      </div>
    </AppShell>
  );
}
