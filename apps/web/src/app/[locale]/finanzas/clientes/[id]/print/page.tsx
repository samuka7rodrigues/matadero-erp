import { notFound } from 'next/navigation';
import { getCliente } from '@/actions/finanzas';
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

export default async function ClientePrintPage({ params }: Props) {
  const { id } = await params;
  const [c, docsResult] = await Promise.all([
    getCliente(id),
    listDocumentos('clientes', id),
  ]);
  if (!c) notFound();

  return (
    <ImpressaoPagina
      titulo={c.nombre}
      subtitulo={c.cif_nif ? `CIF/NIF ${c.cif_nif}` : undefined}
      referencia={`Cliente nº ${c.id.slice(0, 8)}`}
    >
      <PrintSection titulo="Dados do cliente">
        <PrintRow label="Nome" value={c.nombre} />
        <PrintRow label="CIF/NIF" value={c.cif_nif} />
        <PrintRow label="Email" value={c.email} />
        <PrintRow label="Telefone" value={c.telefono} />
        <PrintRow
          label="Morada"
          value={[c.direccion, c.codigo_postal, c.ciudad].filter(Boolean).join(', ')}
        />
        <PrintRow label="País" value={c.pais} />
        <PrintRow label="Estado" value={c.estado} />
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
