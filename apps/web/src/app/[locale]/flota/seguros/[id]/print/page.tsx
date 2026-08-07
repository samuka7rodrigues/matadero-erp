import { notFound } from 'next/navigation';
import { getSeguro } from '@/actions/flota';
import { listDocumentos } from '@/actions/documentos';
import { formatDate } from '@/lib/utils';
import { formatImporte, vehiculoLabel } from '@/components/flota/utils';
import {
  ImpressaoPagina,
  DocumentosImpressao,
  PrintSection,
  PrintRow,
} from '@/components/common/impressao';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SeguroPrintPage({ params }: Props) {
  const { id } = await params;
  const [s, docsResult] = await Promise.all([
    getSeguro(id),
    listDocumentos('flota_seguros', id),
  ]);
  if (!s) notFound();

  return (
    <ImpressaoPagina
      titulo="Seguro de veículo"
      subtitulo={vehiculoLabel(s.vehiculos)}
      referencia={`Seguro nº ${s.id.slice(0, 8)}`}
    >
      <PrintSection titulo="Seguro">
        <PrintRow label="Veículo" value={vehiculoLabel(s.vehiculos)} />
        <PrintRow label="Companhia" value={s.compania} />
        <PrintRow label="Apólice" value={s.poliza} />
        <PrintRow label="Tipo" value={s.tipo} />
        <PrintRow label="Início" value={s.fecha_inicio ? formatDate(s.fecha_inicio) : null} />
        <PrintRow label="Fim" value={s.fecha_fin ? formatDate(s.fecha_fin) : null} />
        <PrintRow label="Importe" value={formatImporte(s.importe)} />
        <PrintRow label="Estado" value={s.estado} />
      </PrintSection>

      {s.observacoes && (
        <PrintSection titulo="Observações">
          <p className="text-sm whitespace-pre-wrap">{s.observacoes}</p>
        </PrintSection>
      )}

      <DocumentosImpressao titulo="Documentos anexados" documentos={docsResult.data} />
    </ImpressaoPagina>
  );
}
