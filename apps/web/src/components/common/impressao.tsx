'use client';

import { AutoPrint } from '@/components/common/auto-print';
import { PrintFooter, PrintHeader, PrintSection, PrintRow } from '@/components/common/print-layout';

export { PrintSection, PrintRow, PrintHeader, PrintFooter };

const TIPO_LABEL: Record<string, string> = {
  documento: 'Documento',
  certificado: 'Certificado',
  informe: 'Informe',
  recibo: 'Recibo',
  comprovativo: 'Comprovativo',
  outro: 'Outro',
  dni: 'DNI',
  nie: 'NIE',
  contrato: 'Contrato',
  exame_medico: 'Exame médico',
  epi: 'EPI',
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export interface PrintDocumento {
  id: string;
  nombre: string;
  categoria?: string;
  tipo?: string;
  descripcion?: string | null;
  descricao?: string | null;
  archivo_size: number | null;
  mime_type: string | null;
  expires_at: string | null;
  url: string | null;
}

function isImage(doc: PrintDocumento): boolean {
  return !!doc.mime_type?.startsWith('image/');
}

export function DocumentosImpressao({
  titulo,
  documentos,
  noDocsMessage = 'Nenhum documento anexado.',
}: {
  titulo: string;
  documentos: PrintDocumento[];
  noDocsMessage?: string;
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 border-b-2 border-primary pb-1 text-base font-bold uppercase">
        {titulo} ({documentos.length})
      </h2>
      {documentos.length === 0 ? (
        <p className="text-sm text-neutral-500">{noDocsMessage}</p>
      ) : (
        <ol className="space-y-6">
          {documentos.map((doc) => {
            const tipo = doc.categoria || doc.tipo || 'documento';
            return (
              <li key={doc.id} className="print:break-inside-avoid">
                <div className="mb-1 flex items-baseline justify-between gap-4 border-b border-dashed pb-1 text-sm">
                  <span className="font-semibold">
                    {TIPO_LABEL[tipo] || tipo} — {doc.nombre}
                  </span>
                  <span className="shrink-0 text-xs text-neutral-500">{formatBytes(doc.archivo_size)}</span>
                </div>
                {(doc.descripcion || doc.descricao) && (
                  <p className="text-xs text-neutral-600">{doc.descripcion || doc.descricao}</p>
                )}
                {doc.expires_at && (
                  <p className="text-xs text-neutral-600">
                    Válido até {new Date(doc.expires_at).toLocaleDateString('pt-PT')}
                  </p>
                )}
                {doc.url &&
                  (isImage(doc) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={doc.url}
                      alt={doc.nombre}
                      className="mt-2 max-h-[400px] w-full rounded border object-contain print:max-h-[380px]"
                    />
                  ) : (
                    <iframe
                      src={doc.url}
                      title={doc.nombre}
                      className="mt-2 h-[400px] w-full rounded border print:h-[380px]"
                    />
                  ))}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function ImpressaoPagina({
  titulo,
  subtitulo,
  referencia,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  referencia: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white text-black">
      <AutoPrint />
      <div className="mx-auto max-w-[210mm] p-8">
        <PrintHeader titulo={titulo} subtitulo={subtitulo} referencia={referencia} />
        {children}
        <PrintFooter />
      </div>
    </div>
  );
}
