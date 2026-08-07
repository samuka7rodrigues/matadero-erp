import { notFound } from 'next/navigation';
import { getVehiculo } from '@/actions/flota';
import { listDocumentos } from '@/actions/documentos';
import { formatKm } from '@/components/flota/utils';
import {
  ImpressaoPagina,
  DocumentosImpressao,
  PrintSection,
  PrintRow,
} from '@/components/common/impressao';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VehiculoPrintPage({ params }: Props) {
  const { id } = await params;
  const [v, docsResult] = await Promise.all([
    getVehiculo(id),
    listDocumentos('flota_vehiculos', id),
  ]);
  if (!v) notFound();

  return (
    <ImpressaoPagina
      titulo={v.matricula}
      subtitulo={[v.marca, v.modelo].filter(Boolean).join(' ')}
      referencia={`Veículo nº ${v.id.slice(0, 8)}`}
    >
      <PrintSection titulo="Veículo">
        <PrintRow label="Matrícula" value={v.matricula} />
        <PrintRow label="Marca" value={v.marca} />
        <PrintRow label="Modelo" value={v.modelo} />
        <PrintRow label="Tipo" value={v.tipo} />
        <PrintRow label="Ano" value={v.ano} />
        <PrintRow label="Quilómetros actuais" value={formatKm(v.km_actuales)} />
        <PrintRow label="Estado" value={v.estado} />
        <PrintRow label="Data de compra" value={v.fecha_compra} />
      </PrintSection>

      {v.observacoes && (
        <PrintSection titulo="Observações">
          <p className="text-sm whitespace-pre-wrap">{v.observacoes}</p>
        </PrintSection>
      )}

      <DocumentosImpressao titulo="Documentos anexados" documentos={docsResult.data} />
    </ImpressaoPagina>
  );
}
