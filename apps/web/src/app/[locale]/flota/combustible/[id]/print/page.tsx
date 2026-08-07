import { notFound } from 'next/navigation';
import { getCombustible } from '@/actions/flota';
import { listDocumentos } from '@/actions/documentos';
import { formatDate } from '@/lib/utils';
import { formatImporte, formatKm, nomeColaborador, vehiculoLabel } from '@/components/flota/utils';
import {
  ImpressaoPagina,
  DocumentosImpressao,
  PrintSection,
  PrintRow,
} from '@/components/common/impressao';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CombustiblePrintPage({ params }: Props) {
  const { id } = await params;
  const [c, docsResult] = await Promise.all([
    getCombustible(id),
    listDocumentos('flota_combustible', id),
  ]);
  if (!c) notFound();

  return (
    <ImpressaoPagina
      titulo="Abastecimento de combustible"
      subtitulo={vehiculoLabel(c.vehiculos)}
      referencia={`Combustible nº ${c.id.slice(0, 8)}`}
    >
      <PrintSection titulo="Abastecimento">
        <PrintRow label="Veículo" value={vehiculoLabel(c.vehiculos)} />
        <PrintRow label="Data" value={formatDate(c.fecha)} />
        <PrintRow label="Litros" value={c.litros} />
        <PrintRow label="Importe" value={formatImporte(c.importe)} />
        <PrintRow label="Quilómetros" value={formatKm(c.km)} />
        <PrintRow label="Tipo" value={c.tipo} />
        <PrintRow label="Condutor" value={nomeColaborador(c.colaboradores)} />
      </PrintSection>

      {c.observacoes && (
        <PrintSection titulo="Observações">
          <p className="text-sm whitespace-pre-wrap">{c.observacoes}</p>
        </PrintSection>
      )}

      <DocumentosImpressao titulo="Documentos anexados" documentos={docsResult.data} />
    </ImpressaoPagina>
  );
}
