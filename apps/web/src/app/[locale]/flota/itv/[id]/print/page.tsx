import { notFound } from 'next/navigation';
import { getITV } from '@/actions/flota';
import { listDocumentos } from '@/actions/documentos';
import { formatDate } from '@/lib/utils';
import { vehiculoLabel } from '@/components/flota/utils';
import {
  ImpressaoPagina,
  DocumentosImpressao,
  PrintSection,
  PrintRow,
} from '@/components/common/impressao';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ITVPrintPage({ params }: Props) {
  const { id } = await params;
  const [i, docsResult] = await Promise.all([
    getITV(id),
    listDocumentos('flota_itv', id),
  ]);
  if (!i) notFound();

  return (
    <ImpressaoPagina
      titulo="Inspección Técnica de Vehículos"
      subtitulo={vehiculoLabel(i.vehiculos)}
      referencia={`ITV nº ${i.id.slice(0, 8)}`}
    >
      <PrintSection titulo="Inspección">
        <PrintRow label="Veículo" value={vehiculoLabel(i.vehiculos)} />
        <PrintRow label="Data" value={formatDate(i.fecha)} />
        <PrintRow label="Validade" value={i.fecha_validez ? formatDate(i.fecha_validez) : null} />
        <PrintRow label="Resultado" value={i.resultado} />
        <PrintRow label="Centro" value={i.centro} />
      </PrintSection>

      {i.observacoes && (
        <PrintSection titulo="Observações">
          <p className="text-sm whitespace-pre-wrap">{i.observacoes}</p>
        </PrintSection>
      )}

      <DocumentosImpressao titulo="Documentos anexados" documentos={docsResult.data} />
    </ImpressaoPagina>
  );
}
