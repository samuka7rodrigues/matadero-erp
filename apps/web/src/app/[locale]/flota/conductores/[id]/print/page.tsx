import { notFound } from 'next/navigation';
import { getConductor } from '@/actions/flota';
import { listDocumentos } from '@/actions/documentos';
import { formatDate } from '@/lib/utils';
import { nomeColaborador, vehiculoLabel } from '@/components/flota/utils';
import {
  ImpressaoPagina,
  DocumentosImpressao,
  PrintSection,
  PrintRow,
} from '@/components/common/impressao';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConductorPrintPage({ params }: Props) {
  const { id } = await params;
  const [c, docsResult] = await Promise.all([
    getConductor(id),
    listDocumentos('flota_conductores', id),
  ]);
  if (!c) notFound();

  return (
    <ImpressaoPagina
      titulo="Atribuição de condutor"
      subtitulo={nomeColaborador(c.colaboradores)}
      referencia={`Condutor nº ${c.id.slice(0, 8)}`}
    >
      <PrintSection titulo="Atribuição">
        <PrintRow label="Veículo" value={vehiculoLabel(c.vehiculos)} />
        <PrintRow label="Condutor" value={nomeColaborador(c.colaboradores)} />
        <PrintRow label="Desde" value={formatDate(c.asignado_desde)} />
        <PrintRow label="Até" value={c.asignado_hasta ? formatDate(c.asignado_hasta) : null} />
        <PrintRow label="Principal" value={c.principal ? 'Sim' : 'Não'} />
      </PrintSection>

      <DocumentosImpressao titulo="Documentos anexados" documentos={docsResult.data} />
    </ImpressaoPagina>
  );
}
