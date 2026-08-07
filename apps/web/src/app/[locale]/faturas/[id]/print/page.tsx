import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { getFatura, listFaturaItens } from '@/actions/finanzas';
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

export default async function FaturaPrintPage({ params }: Props) {
  const { id } = await params;
  const locale = await getLocale();
  const [f, itensResult, docsResult] = await Promise.all([
    getFatura(id),
    listFaturaItens(id),
    listDocumentos('faturas', id),
  ]);
  if (!f) notFound();

  return (
    <ImpressaoPagina
      titulo={`Fatura ${f.numero}`}
      subtitulo={`Emitida a ${formatDate(f.fecha_emision, locale)}`}
      referencia={`Fatura nº ${f.id.slice(0, 8)}`}
    >
      <PrintSection titulo="Dados da fatura">
        <PrintRow label="Número" value={f.numero} />
        <PrintRow label="Data de emissão" value={formatDate(f.fecha_emision, locale)} />
        <PrintRow label="Vencimento" value={f.fecha_vencimiento ? formatDate(f.fecha_vencimiento, locale) : null} />
        <PrintRow label="Estado" value={f.estado} />
      </PrintSection>

      {itensResult.data.length > 0 && (
        <PrintSection titulo="Itens">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-1.5 pr-2">Descrição</th>
                <th className="py-1.5 pr-2 text-right">Qtd</th>
                <th className="py-1.5 pr-2 text-right">Preço</th>
                <th className="py-1.5 pr-2 text-right">IVA</th>
                <th className="py-1.5 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {itensResult.data.map((item) => (
                <tr key={item.id} className="border-b border-dashed">
                  <td className="py-1.5 pr-2">{item.descricao}</td>
                  <td className="py-1.5 pr-2 text-right">{item.quantidade}</td>
                  <td className="py-1.5 pr-2 text-right">{formatCurrency(Number(item.preco_unitario), locale)}</td>
                  <td className="py-1.5 pr-2 text-right">{item.iva_pct}%</td>
                  <td className="py-1.5 text-right">{formatCurrency(Number(item.importe), locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 ml-auto w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Base imponible</span>
              <span>{formatCurrency(Number(f.base_imponible), locale)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">IVA</span>
              <span>{formatCurrency(Number(f.iva), locale)}</span>
            </div>
            <div className="flex justify-between border-t border-black pt-1 font-bold">
              <span>Total</span>
              <span>{formatCurrency(Number(f.total), locale)}</span>
            </div>
          </div>
        </PrintSection>
      )}

      {f.observacoes && (
        <PrintSection titulo="Observações">
          <p className="text-sm whitespace-pre-wrap">{f.observacoes}</p>
        </PrintSection>
      )}

      <DocumentosImpressao titulo="Documentos anexados" documentos={docsResult.data} />
    </ImpressaoPagina>
  );
}
