import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { getDespesa } from '@/actions/finanzas';
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

export default async function DespesaPrintPage({ params }: Props) {
  const { id } = await params;
  const locale = await getLocale();
  const [d, docsResult] = await Promise.all([
    getDespesa(id),
    listDocumentos('despesas', id),
  ]);
  if (!d) notFound();

  return (
    <ImpressaoPagina
      titulo={d.concepto}
      subtitulo="Despesa"
      referencia={`Despesa nº ${d.id.slice(0, 8)}`}
    >
      <PrintSection titulo="Dados da despesa">
        <PrintRow label="Concepto" value={d.concepto} />
        <PrintRow label="Cliente" value={d.clientes?.nombre} />
        <PrintRow label="Categoria" value={d.categoria} />
        <PrintRow label="Data" value={formatDate(d.data, locale)} />
        <PrintRow label="Importe" value={formatCurrency(Number(d.importe), locale)} />
        <PrintRow label="IVA" value={d.iva != null ? `${d.iva}%` : null} />
        <PrintRow label="Fornecedor" value={d.fornecedor} />
        <PrintRow label="Forma de pagamento" value={d.forma_pago} />
        <PrintRow label="Estado" value={d.estado} />
      </PrintSection>

      {d.observacoes && (
        <PrintSection titulo="Observações">
          <p className="text-sm whitespace-pre-wrap">{d.observacoes}</p>
        </PrintSection>
      )}

      <DocumentosImpressao titulo="Documentos anexados" documentos={docsResult.data} />
    </ImpressaoPagina>
  );
}
