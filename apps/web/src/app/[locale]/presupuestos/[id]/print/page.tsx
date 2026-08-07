import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { getPresupuesto, listPresupuestoItens } from '@/actions/finanzas';
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

export default async function PresupuestoPrintPage({ params }: Props) {
  const { id } = await params;
  const locale = await getLocale();
  const [p, itensResult, docsResult] = await Promise.all([
    getPresupuesto(id),
    listPresupuestoItens(id),
    listDocumentos('presupuestos', id),
  ]);
  if (!p) notFound();

  return (
    <ImpressaoPagina
      titulo={`Presupuesto ${p.numero}`}
      subtitulo={p.titulo}
      referencia={`Presupuesto nº ${p.id.slice(0, 8)}`}
    >
      <PrintSection titulo="Dados do presupuesto">
        <PrintRow label="Número" value={p.numero} />
        <PrintRow label="Título" value={p.titulo} />
        <PrintRow label="Data" value={formatDate(p.data, locale)} />
        <PrintRow label="Validade" value={p.validade ? formatDate(p.validade, locale) : null} />
        <PrintRow label="Estado" value={p.estado} />
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
              <span>{formatCurrency(Number(p.base_imponible), locale)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">IVA</span>
              <span>{formatCurrency(Number(p.iva), locale)}</span>
            </div>
            <div className="flex justify-between border-t border-black pt-1 font-bold">
              <span>Total</span>
              <span>{formatCurrency(Number(p.total), locale)}</span>
            </div>
          </div>
        </PrintSection>
      )}

      {p.observacoes && (
        <PrintSection titulo="Observações">
          <p className="text-sm whitespace-pre-wrap">{p.observacoes}</p>
        </PrintSection>
      )}

      <DocumentosImpressao titulo="Documentos anexados" documentos={docsResult.data} />
    </ImpressaoPagina>
  );
}
