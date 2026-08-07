'use client';

import { Link } from '@/i18n/config';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, Mail, Phone, Pencil, Trash2, Users, Paperclip, FileDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ColaboradorCompleto } from '@/types/database';
import { deleteColaborador } from '@/actions/colaboradores';

interface Props {
  colaboradores: ColaboradorCompleto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  showAll: boolean;
  hasFilter: boolean;
}

export function ColaboradoresList({ colaboradores, total, page, totalPages, showAll, hasFilter }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  function applyFilter() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const estado = searchParams.get('estado');
    if (estado) params.set('estado', estado);
    router.push(`/colaboradores?${params.toString()}`);
  }

  function showAllRows() {
    router.push('/colaboradores?todos=1');
  }

  async function handleDelete(id: string, nome: string) {
    if (!window.confirm(`Eliminar o colaborador "${nome}"?`)) return;
    const result = await deleteColaborador(id);
    if (!result.success) {
      window.alert(result.error || 'Erro ao eliminar colaborador');
      return;
    }
    router.refresh();
  }

  const showEmptyInitial = !showAll && !hasFilter;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-2 p-4 border-b sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome, NIF, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select defaultValue={searchParams.get('estado') || ''} className="w-full sm:w-40">
            <option value="">Todos os estados</option>
            <option value="ativo">Ativo</option>
            <option value="baixa">Baixa</option>
            <option value="ferias">Férias</option>
            <option value="inativo">Inativo</option>
          </Select>
          <Button onClick={applyFilter}>Filtrar</Button>
          {!showAll && (
            <Button variant="outline" onClick={showAllRows}>
              Mostrar todos
            </Button>
          )}
        </div>
      </div>

      {showEmptyInitial ? (
        <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground max-w-md">
            O quadro está vazio. Utilize a pesquisa acima por nome, NIF ou
            e-mail, ou clique em &quot;Mostrar todos&quot; para ver todos os colaboradores.
          </p>
          <Button variant="outline" size="sm" onClick={showAllRows}>
            <Users className="mr-2 h-4 w-4" />
            Mostrar todos
          </Button>
        </div>
      ) : (
        <>
          {/* Tabela */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>NIF</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Salário</TableHead>
                <TableHead>Admissão</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colaboradores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum colaborador encontrado
                  </TableCell>
                </TableRow>
              ) : (
                colaboradores.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Link href={`/colaboradores/${f.id}`} className="font-medium hover:underline">
                        {f.apellido1}, {f.nombre}
                      </Link>
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {f.email}
                        </span>
                        {f.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {f.telefono}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{f.nif}</TableCell>
                    <TableCell>{f.departamentos?.nombre || '—'}</TableCell>
                    <TableCell>{f.categoria_profesional || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{f.tipo_contrato}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(f.salario_base)}</TableCell>
                    <TableCell>{formatDate(f.fecha_admision)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          f.estado === 'ativo' ? 'success' :
                          f.estado === 'inativo' ? 'secondary' :
                          'warning'
                        }
                      >
                        {f.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild title="Adicionar documento">
                          <Link href={`/colaboradores/${f.id}/edit#documentos`}>
                            <Paperclip className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Exportar PDF">
                          <Link href={`/colaboradores/${f.id}/print`}>
                            <FileDown className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Editar">
                          <Link href={`/colaboradores/${f.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Eliminar"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(f.id, `${f.apellido1}, ${f.nombre}`)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Paginação */}
          <div className="flex flex-col gap-3 p-4 border-t text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">
              {total} {total === 1 ? 'colaborador' : 'colaboradores'} · Página {page} de {totalPages || 1}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', String(page - 1));
                  router.push(`/colaboradores?${params.toString()}`);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', String(page + 1));
                  router.push(`/colaboradores?${params.toString()}`);
                }}
              >
                Seguinte
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
