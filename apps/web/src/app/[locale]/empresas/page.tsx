import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Plus, Mail, Phone } from 'lucide-react';
import { listEmpresas } from '@/actions/empresa';
import { EmpresaActions } from '@/components/empresa/empresa-actions';
import { MostrarTodos } from '@/components/common/mostrar-todos';
import { countDocumentos } from '@/actions/documentos';
import { DocumentoAnexo } from '@/components/documentos/documento-anexo';

export default async function EmpresasPage() {
  const t = await getTranslations('Empresa');
  const td = await getTranslations('Documentos');
  const { data: empresas, error } = await listEmpresas();
  const { documentos } = await countDocumentos('empresas');

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <Button asChild>
            <Link href="/empresas/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('new')}
            </Link>
          </Button>
        </div>

        <Card>
          {error ? (
            <div className="p-6 text-sm text-destructive">Erro: {error}</div>
          ) : empresas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t('noData')}</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/empresas/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('new')}
                </Link>
              </Button>
            </div>
          ) : (
            <MostrarTodos count={empresas.length}>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CIF/NIF</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-center">{td('title')}</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresas.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Link href={`/empresas/${e.id}`} className="font-medium hover:underline">
                        {e.nombre}
                      </Link>
                      {e.nombre_comercial && (
                        <div className="text-xs text-muted-foreground">{e.nombre_comercial}</div>
                      )}
                      {e.iva != null && (
                        <div className="mt-1">
                          <Badge variant="outline">IVA {e.iva}%</Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{e.cif_nif || '—'}</TableCell>
                    <TableCell>{e.ciudad || '—'}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {e.correo && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" /> {e.correo}
                          </span>
                        )}
                        {e.telefono && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" /> {e.telefono}
                          </span>
                        )}
                        {!e.correo && !e.telefono && <span className="text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <DocumentoAnexo
                          entidade="empresas"
                          entidadeId={e.id}
                          referencia={e.nombre}
                          count={documentos[e.id] || 0}
                          iconOnly
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <EmpresaActions id={e.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </MostrarTodos>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
