import { notFound } from 'next/navigation';
import { getKilometraje } from '@/actions/flota';
import { listDocumentos } from '@/actions/documentos';
import { formatDate } from '@/lib/utils';
import { formatKm, nomeColaborador, vehiculoLabel } from '@/components/flota/utils';
import {
  ImpressaoPagina,
  DocumentosImpressao,
  PrintSection,
  PrintRow,
} from '@/components/common/impressao';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function KilometrajePrintPage({ params }: Props) {
  const { id } = await params;
  const [k, docsResult] = await Promise.all([
    getKilometraje(id),
    listDocumentos('flota_kilometraje', id),
  ]);
  if (!k) notFound();

  return (
    <ImpressaoPagina
      titulo="Registo de quilómetros"
      subtitulo={vehiculoLabel(k.vehiculos)}
      referencia={`Kilometraje nº ${k.id.slice(0, 8)}`}
    >
      <PrintSection titulo="Registo">
        <PrintRow label="Veículo" value={vehiculoLabel(k.vehiculos)} />
        <PrintRow label="Data" value={formatDate(k.fecha)} />
        <PrintRow label="Quilómetros" value={formatKm(k.km)} />
        <PrintRow label="Condutor" value={nomeColaborador(k.colaboradores)} />
      </PrintSection>

      {k.observacoes && (
        <PrintSection titulo="Observações">
          <p className="text-sm whitespace-pre-wrap">{k.observacoes}</p>
        </PrintSection>
      )}

      <DocumentosImpressao titulo="Documentos anexados" documentos={docsResult.data} />
    </ImpressaoPagina>
  );
}
