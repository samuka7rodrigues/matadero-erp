import { notFound } from 'next/navigation';
import { getMantenimiento } from '@/actions/flota';
import { listDocumentos } from '@/actions/documentos';
import { formatDate } from '@/lib/utils';
import { formatImporte, formatKm, vehiculoLabel } from '@/components/flota/utils';
import {
  ImpressaoPagina,
  DocumentosImpressao,
  PrintSection,
  PrintRow,
} from '@/components/common/impressao';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MantenimientoPrintPage({ params }: Props) {
  const { id } = await params;
  const [m, docsResult] = await Promise.all([
    getMantenimiento(id),
    listDocumentos('flota_mantenimiento', id),
  ]);
  if (!m) notFound();

  return (
    <ImpressaoPagina
      titulo="Mantenimiento de vehículo"
      subtitulo={vehiculoLabel(m.vehiculos)}
      referencia={`Mantenimiento nº ${m.id.slice(0, 8)}`}
    >
      <PrintSection titulo="Mantenimiento">
        <PrintRow label="Veículo" value={vehiculoLabel(m.vehiculos)} />
        <PrintRow label="Data" value={formatDate(m.fecha)} />
        <PrintRow label="Tipo" value={m.tipo} />
        <PrintRow label="Descrição" value={m.descricao} />
        <PrintRow label="Quilómetros" value={formatKm(m.km)} />
        <PrintRow label="Importe" value={formatImporte(m.importe)} />
        <PrintRow label="Proveedor" value={m.proveedor} />
      </PrintSection>

      {m.observacoes && (
        <PrintSection titulo="Observações">
          <p className="text-sm whitespace-pre-wrap">{m.observacoes}</p>
        </PrintSection>
      )}

      <DocumentosImpressao titulo="Documentos anexados" documentos={docsResult.data} />
    </ImpressaoPagina>
  );
}
