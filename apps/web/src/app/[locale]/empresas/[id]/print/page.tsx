import { notFound } from 'next/navigation';
import { getEmpresaComLogotipo } from '@/actions/empresa';
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

export default async function EmpresaPrintPage({ params }: Props) {
  const { id } = await params;
  const [e, docsResult] = await Promise.all([
    getEmpresaComLogotipo(id),
    listDocumentos('empresas', id),
  ]);
  if (!e) notFound();

  return (
    <ImpressaoPagina
      titulo={e.nombre}
      subtitulo={e.nombre_comercial || (e.cif_nif ? `CIF/NIF ${e.cif_nif}` : undefined)}
      referencia={`Empresa nº ${e.id.slice(0, 8)}`}
    >
      <PrintSection titulo="Identificação">
        <PrintRow label="Nome" value={e.nombre} />
        <PrintRow label="Nome comercial" value={e.nombre_comercial} />
        <PrintRow label="CIF/NIF" value={e.cif_nif} />
        <PrintRow label="IVA" value={e.iva != null ? `${e.iva}%` : null} />
      </PrintSection>

      <PrintSection titulo="Contacto">
        <PrintRow label="Morada" value={[e.direccion, e.codigo_postal, e.ciudad].filter(Boolean).join(', ')} />
        <PrintRow label="País" value={e.pais} />
        <PrintRow label="Telefone" value={e.telefono} />
        <PrintRow label="Email" value={e.correo} />
        <PrintRow label="Web" value={e.web} />
      </PrintSection>

      <PrintSection titulo="Banca">
        <PrintRow label="Banco" value={e.banco} />
        <PrintRow label="IBAN" value={e.iban} />
        <PrintRow label="SWIFT/BIC" value={e.swift} />
      </PrintSection>

      <PrintSection titulo="Responsáveis">
        <PrintRow label="Direção" value={e.responsable_direccion} />
        <PrintRow label="Recursos Humanos" value={e.responsable_rrhh} />
        <PrintRow label="Finanças" value={e.responsable_finanzas} />
        <PrintRow label="Operações" value={e.responsable_operaciones} />
      </PrintSection>

      {e.logoUrl && (
        <PrintSection titulo="Logotipo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.logoUrl} alt={e.nombre} className="max-h-40 max-w-full object-contain" />
        </PrintSection>
      )}

      <DocumentosImpressao titulo="Documentos anexados" documentos={docsResult.data} />
    </ImpressaoPagina>
  );
}
