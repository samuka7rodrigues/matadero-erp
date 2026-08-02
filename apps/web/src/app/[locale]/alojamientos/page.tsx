import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Home, Plus, MapPin } from 'lucide-react';
import { listAlojamientos } from '@/actions/alojamiento';
import { AlojamientoActions } from '@/components/alojamientos/alojamiento-actions';
import { countDocumentos } from '@/actions/documentos';
import { DocumentoAnexo } from '@/components/documentos/documento-anexo';

export default async function AlojamientosPage() {
  const t = await getTranslations('Alojamiento');
  const td = await getTranslations('Documentos');
  const { data: alojamientos, error } = await listAlojamientos();
  const { documentos } = await countDocumentos('alojamientos');

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <Button asChild>
            <Link href="/alojamientos/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('new')}
            </Link>
          </Button>
        </div>

        <Card>
          {error ? (
            <div className="p-6 text-sm text-destructive">Erro: {error}</div>
          ) : alojamientos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Home className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t('noData')}</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/alojamientos/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('new')}
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vivienda</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">{td('title')}</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alojamientos.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Link href={`/alojamientos/${a.id}`} className="font-medium hover:underline">
                        {a.nombre}
                      </Link>
                      {(a.direccion || a.ciudad) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {[a.direccion, a.ciudad].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{a.codigo || '—'}</TableCell>
                    <TableCell className="capitalize">{a.tipo}</TableCell>
                    <TableCell>{a.capacidad ?? '—'}</TableCell>
                    <TableCell>{a.empresas?.nombre || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={a.estado === 'ativo' ? 'success' : 'secondary'}>
                        {t(`estados.${a.estado}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <DocumentoAnexo
                          entidade="alojamientos"
                          entidadeId={a.id}
                          referencia={a.nombre}
                          count={documentos[a.id] || 0}
                          iconOnly
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <AlojamientoActions id={a.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
