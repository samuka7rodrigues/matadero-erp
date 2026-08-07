import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import {
  ImpressaoPagina,
  DocumentosImpressao,
  PrintSection,
  PrintRow,
} from '@/components/common/impressao';
import { listDocumentos, type EntidadeDocumento } from '@/actions/documentos';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CertificadoPrintPage({ params }: Props) {
  const { id } = await params;
  const locale = await getLocale();
  const supabase = createClient();

  const [certResult, docsResult] = await Promise.all([
    supabase.from('certificados').select('*, colaboradores(nombre, apellido1, apellido2)').eq('id', id).single(),
    listDocumentos('epis' as EntidadeDocumento, id),
  ]);

  if (certResult.error || !certResult.data) notFound();
  const c = certResult.data;
  const col = c.colaboradores;
  const nomeColab = col ? [col.nombre, col.apellido1, col.apellido2].filter(Boolean).join(' ') : '—';

  return (
    <ImpressaoPagina
      titulo={`Certificado: ${c.nombre}`}
      subtitulo={c.entidad || ''}
      referencia={`Certificado nº ${c.id.slice(0, 8)}`}
    >
      <PrintSection titulo="Detalhes do Certificado">
        <PrintRow label="Colaborador" value={nomeColab} />
        <PrintRow label="Nome" value={c.nombre} />
        <PrintRow label="Entidade" value={c.entidad} />
        <PrintRow label="Tipo" value={c.tipo} />
        <PrintRow label="Número" value={c.numero} />
        <PrintRow label="Data de Emissão" value={formatDate(c.data_emision, locale)} />
        <PrintRow label="Data de Validade" value={c.data_validez ? formatDate(c.data_validez, locale) : null} />
        <PrintRow label="Observações" value={c.observacoes} />
      </PrintSection>

      <DocumentosImpressao titulo="Documentos Anexados" documentos={docsResult.data} />
    </ImpressaoPagina>
  );
}
