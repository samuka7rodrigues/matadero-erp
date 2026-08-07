import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTranslations } from 'next-intl/server';
import { getColaborador, listDocumentos } from '@/actions/colaboradores';
import { DocumentosCard } from '@/components/colaboradores/documentos-card';
import { ArrowLeft, Pencil, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { Link } from '@/i18n/config';
import { formatCurrency, formatDate, calculateAge } from '@/lib/utils';
import { notFound } from 'next/navigation';

interface Props {
  // Next.js 14+: params é Promise — precisa de await
  params: Promise<{ id: string }>;
}

export default async function ColaboradorDetalhePage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('Colaboradores');
  const [f, docsResult] = await Promise.all([
    getColaborador(id),
    listDocumentos(id),
  ]);
  if (!f) notFound();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/colaboradores">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {f.nombre} {f.apellido1} {f.apellido2}
              </h1>
              <p className="text-muted-foreground">
                {f.categoria_profesional} · {f.departamentos?.nombre || 'Sem departamento'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:ml-auto">
            <Badge
              variant={f.estado === 'ativo' ? 'success' : 'secondary'}
            >
              {f.estado}
            </Badge>
            <Button variant="outline" asChild>
              <Link href={`/colaboradores/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Dados pessoais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">NIF</span>
                <span className="font-mono">{f.nif}</span>
              </div>
              {f.nie && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NIE</span>
                  <span className="font-mono">{f.nie}</span>
                </div>
              )}
              {f.passaporte && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passaporte</span>
                  <span className="font-mono">{f.passaporte}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nacionalidad</span>
                <span>{f.nacionalidad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha de nacimiento</span>
                <span>{formatDate(f.fecha_nacimiento)} ({calculateAge(f.fecha_nacimiento)} años)</span>
              </div>
              {f.estado_civil && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado civil</span>
                  <span>{f.estado_civil}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card>
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{f.email}</span>
              </div>
              {f.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{f.telefono}</span>
                </div>
              )}
              {f.direccion && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>
                    {f.direccion}
                    {f.codigo_postal && `, ${f.codigo_postal}`}
                    {f.ciudad && ` ${f.ciudad}`}
                  </span>
                </div>
              )}
              {f.contacto_emergencia && (
                <div className="border-t pt-3 mt-3">
                  <div className="text-xs text-muted-foreground">Contacto emergência</div>
                  <div>{f.contacto_emergencia}</div>
                  {f.telefono_emergencia && <div className="text-muted-foreground">{f.telefono_emergencia}</div>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dados profissionais */}
          <Card>
            <CardHeader>
              <CardTitle>Datos profesionales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo de contrato</span>
                <Badge variant="outline">{f.tipo_contrato}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jornada</span>
                <span>{f.jornada} ({f.horas_semanales}h/semana)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Salário base</span>
                <span className="font-semibold">{formatCurrency(f.salario_base)} /mês</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Convenio</span>
                <span className="text-xs">{f.convenio_aplicable}</span>
              </div>
              <div className="flex items-center gap-2 border-t pt-3 mt-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Admisión: {formatDate(f.fecha_admision)}</span>
              </div>
              {f.fecha_fin_contrato && (
                <div className="flex items-center gap-2 text-amber-600">
                  <Calendar className="h-4 w-4" />
                  <span>Fin contrato: {formatDate(f.fecha_fin_contrato)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dados bancários */}
          <Card>
            <CardHeader>
              <CardTitle>Datos bancarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {f.iban && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IBAN</span>
                  <span className="font-mono text-xs">{f.iban}</span>
                </div>
              )}
              {f.banco_nombre && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Banco</span>
                  <span>{f.banco_nombre}</span>
                </div>
              )}
              {f.numero_seguridad_social && (
                <div className="flex justify-between border-t pt-3 mt-3">
                  <span className="text-muted-foreground">Nº Seg. Social</span>
                  <span className="font-mono text-xs">{f.numero_seguridad_social}</span>
                </div>
              )}
              {f.mutua && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('fields.mutua')}</span>
                  <span>{f.mutua}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DocumentosCard colaboradorId={id} documentos={docsResult.data} />
      </div>
    </AppShell>
  );
}
