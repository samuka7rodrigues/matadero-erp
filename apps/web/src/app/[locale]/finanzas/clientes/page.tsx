import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Users, Pencil, FileDown } from 'lucide-react';
import { listClientes, deleteCliente } from '@/actions/finanzas';
import { DeleteButton } from '@/components/finanzas/delete-button';
import { MostrarTodos } from '@/components/common/mostrar-todos';
import { countDocumentos } from '@/actions/documentos';
import { DocumentoAnexo } from '@/components/documentos/documento-anexo';

export default async function ClientesPage() {
  const t = await getTranslations('Finanzas');
  const tc = await getTranslations('Common');
  const td = await getTranslations('Documentos');
  const { data: clientes, error } = await listClientes();
  const { documentos } = await countDocumentos('clientes');

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('clientes.title')}</h1>
          <Button asChild>
            <Link href="/finanzas/clientes/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('clientes.new')}
            </Link>
          </Button>
        </div>

        <Card>
          {error ? (
            <div className="p-6 text-sm text-destructive">Erro: {error}</div>
          ) : clientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t('clientes.noData')}</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/finanzas/clientes/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('clientes.new')}
                </Link>
              </Button>
            </div>
          ) : (
            <MostrarTodos count={clientes.length}>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('clientes.nombre')}</TableHead>
                  <TableHead>{t('clientes.cifNif')}</TableHead>
                  <TableHead>{t('clientes.email')}</TableHead>
                  <TableHead>{t('clientes.telefono')}</TableHead>
                  <TableHead>{t('clientes.ciudad')}</TableHead>
                  <TableHead>{t('clientes.estado')}</TableHead>
                  <TableHead className="text-center">{td('title')}</TableHead>
                  <TableHead className="text-right">{tc('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/finanzas/clientes/${c.id}`} className="font-medium hover:underline">
                        {c.nombre}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.cif_nif || '—'}</TableCell>
                    <TableCell>{c.email || '—'}</TableCell>
                    <TableCell>{c.telefono || '—'}</TableCell>
                    <TableCell>{c.ciudad || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={c.estado === 'ativo' ? 'success' : 'secondary'}>
                        {c.estado === 'ativo' ? t('clientes.estado') + ': Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <DocumentoAnexo
                          entidade="clientes"
                          entidadeId={c.id}
                          referencia={c.nombre}
                          count={documentos[c.id] || 0}
                          iconOnly
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild title="Exportar PDF">
                          <Link href={`/finanzas/clientes/${c.id}/print`}>
                            <FileDown className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title={tc('edit')}>
                          <Link href={`/finanzas/clientes/${c.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteButton id={c.id} confirmMessage={t('clientes.confirmDelete')} onDelete={deleteCliente} />
                      </div>
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
