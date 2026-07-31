'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportarColaboradores } from '@/actions/colaboradores';

interface Props {
  search: string;
  estado: string;
}

const HEADERS = [
  'ID',
  'NIF',
  'NIE',
  'Passaporte',
  'Nome',
  '1º Apelido',
  '2º Apelido',
  'Email',
  'Telefone',
  'Departamento',
  'Categoria profissional',
  'Tipo contrato',
  'Salário base',
  'Data admissão',
  'Estado',
];

export function ExportarButton({ search, estado }: Props) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const { data, error } = await exportarColaboradores({ search, estado });
      if (error) {
        alert(`Erro ao exportar: ${error}`);
        return;
      }

      const rows = data.map((f) => [
        f.id,
        f.nif,
        f.nie,
        f.passaporte,
        f.nombre,
        f.apellido1,
        f.apellido2,
        f.email,
        f.telefono,
        (f.departamentos as { nombre?: string } | null)?.nombre,
        f.categoria_profesional,
        f.tipo_contrato,
        f.salario_base,
        f.fecha_admision,
        f.estado,
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
      worksheet['!cols'] = HEADERS.map((h) => ({
        wch: Math.max(h.length, 12),
      }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Colaboradores');

      XLSX.writeFile(workbook, `colaboradores_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={exporting}>
      {exporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="mr-2 h-4 w-4" />
      )}
      Exportar
    </Button>
  );
}
