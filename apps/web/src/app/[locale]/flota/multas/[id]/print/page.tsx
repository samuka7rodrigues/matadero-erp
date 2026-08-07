import { notFound } from 'next/navigation';
import { getMulta } from '@/actions/flota';
import { listDocumentos } from '@/actions/documentos';
import { formatDate } from '@/lib/utils';
import { formatImporte, nomeColaborador, vehiculoLabel } from '@/components/flota/utils';
import {
  ImpressaoPagina,
  DocumentosImpressao,
  PrintSection,
  PrintRow,
} from '@/components/common/impressao';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MultaPrintPage({ params }: Props) {
  const { id } = await params;
  const [m, docsResult] = await Promise.all([
    getMulta(id),
    listDocumentos('flota_multas', id),
  ]);
  if (!m) notFound();

  return (
    <ImpressaoPagina
      titulo="Multa de trânsito"
      subtitulo={vehiculoLabel(m.vehiculos)}
      referencia={`Multa nº ${m.id.slice(0, 8)}`}
    >
      <PrintSection titulo="Multa">
        <PrintRow label="Veículo" value={vehiculoLabel(m.vehiculos)} />
        <PrintRow label="Condutor" value={nomeColaborador(m.colaboradores)} />
        <PrintRow label="Data" value={formatDate(m.fecha)} />
        <PrintRow label="Importe" value={formatImporte(m.importe)} />
        <PrintRow label="Descrição" value={m.descricao} />
        <PrintRow label="Local" value={m.lugar} />
        <PrintRow label="Estado" value={m.estado} />
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
