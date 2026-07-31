'use client';

import { Link } from '@/i18n/config';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, Mail, Phone, Pencil } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ColaboradorCompleto } from '@/types/database';

interface Props {
  colaboradores: ColaboradorCompleto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function ColaboradoresList({ colaboradores, total, page, totalPages }: Props) {
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

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 p-4 border-b">
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
        <Select defaultValue={searchParams.get('estado') || ''} className="w-40">
          <option value="">Todos os estados</option>
          <option value="ativo">Ativo</option>
          <option value="baixa">Baixa</option>
          <option value="ferias">Férias</option>
          <option value="inativo">Inativo</option>
        </Select>
        <Button onClick={applyFilter}>Filtrar</Button>
      </div>

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
                  <Button variant="ghost" size="icon" asChild title="Editar">
                    <Link href={`/colaboradores/${f.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Paginação */}
      <div className="flex items-center justify-between p-4 border-t text-sm">
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
    </div>
  );
}
