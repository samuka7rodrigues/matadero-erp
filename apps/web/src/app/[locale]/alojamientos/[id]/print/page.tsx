import { notFound } from 'next/navigation';
import { getAlojamiento } from '@/actions/alojamiento';
import { listDocumentos } from '@/actions/documentos';
import {
  ImpressaoPagina,
  DocumentosImpressao,
  PrintSection,
  PrintRow,
} from '@/components/common/impressao';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AlojamientoPrintPage({ params }: Props) {
  const { id } = await params;
  const [a, docsResult] = await Promise.all([
    getAlojamiento(id),
    listDocumentos('alojamientos', id),
  ]);
  if (!a) notFound();

  return (
    <ImpressaoPagina
      titulo={a.nombre}
      subtitulo={[a.codigo, a.tipo].filter(Boolean).join(' · ')}
      referencia={`Alojamento nº ${a.id.slice(0, 8)}`}
    >
      <PrintSection titulo="Vivienda">
        <PrintRow label="Código" value={a.codigo} />
        <PrintRow label="Tipo" value={a.tipo} />
        <PrintRow label="Capacidade" value={a.capacidad} />
        <PrintRow label="Morada" value={[a.direccion, a.codigo_postal, a.ciudad].filter(Boolean).join(', ')} />
        <PrintRow label="País" value={a.pais} />
      </PrintSection>

      <PrintSection titulo="Económico e gestão">
        <PrintRow label="Renda mensal" value={a.renda_mensal != null ? `${a.renda_mensal.toLocaleString('pt-PT')} €` : null} />
        <PrintRow label="Responsável" value={a.responsable} />
        <PrintRow label="Estado" value={a.estado} />
      </PrintSection>

      {a.observacoes && (
        <PrintSection titulo="Observações">
          <p className="text-sm whitespace-pre-wrap">{a.observacoes}</p>
        </PrintSection>
      )}

      <DocumentosImpressao titulo="Documentos anexados" documentos={docsResult.data} />
    </ImpressaoPagina>
  );
}
