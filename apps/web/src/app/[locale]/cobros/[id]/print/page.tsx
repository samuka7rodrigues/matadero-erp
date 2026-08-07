import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { getCobro } from '@/actions/finanzas';
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

export default async function CobroPrintPage({ params }: Props) {
  const { id } = await params;
  const locale = await getLocale();
  const [c, docsResult] = await Promise.all([
    getCobro(id),
    listDocumentos('cobros', id),
  ]);
  if (!c) notFound();

  return (
    <ImpressaoPagina
      titulo="Cobro"
      subtitulo={c.faturas?.numero ? `Fatura ${c.faturas.numero}` : undefined}
      referencia={`Cobro nº ${c.id.slice(0, 8)}`}
    >
      <PrintSection titulo="Dados do cobro">
        <PrintRow label="Fatura" value={c.faturas?.numero} />
        <PrintRow label="Data" value={formatDate(c.data, locale)} />
        <PrintRow label="Importe" value={formatCurrency(Number(c.importe), locale)} />
        <PrintRow label="Método de pagamento" value={c.metodo_pago} />
        <PrintRow label="Referência" value={c.referencia} />
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
