import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { getPago } from '@/actions/finanzas';
import { listDocumentos } from '@/actions/documentos';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ImpressaoPagina,
  DocumentosImpressao,
  PrintSection,
  PrintRow,
} from '@/components/common/impressao';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PagoPrintPage({ params }: Props) {
  const { id } = await params;
  const locale = await getLocale();
  const [p, docsResult] = await Promise.all([
    getPago(id),
    listDocumentos('pagos', id),
  ]);
  if (!p) notFound();

  return (
    <ImpressaoPagina
      titulo={p.concepto}
      subtitulo="Pago"
      referencia={`Pago nº ${p.id.slice(0, 8)}`}
    >
      <PrintSection titulo="Dados do pago">
        <PrintRow label="Concepto" value={p.concepto} />
        <PrintRow label="Data" value={formatDate(p.data, locale)} />
        <PrintRow label="Importe" value={formatCurrency(Number(p.importe), locale)} />
        <PrintRow label="Categoria" value={p.categoria} />
        <PrintRow label="Método de pagamento" value={p.metodo_pago} />
        <PrintRow label="Referência" value={p.referencia} />
        <PrintRow label="Estado" value={p.estado} />
      </PrintSection>

      {p.observacoes && (
        <PrintSection titulo="Observações">
          <p className="text-sm whitespace-pre-wrap">{p.observacoes}</p>
        </PrintSection>
      )}

      <DocumentosImpressao titulo="Documentos anexados" documentos={docsResult.data} />
    </ImpressaoPagina>
  );
}
