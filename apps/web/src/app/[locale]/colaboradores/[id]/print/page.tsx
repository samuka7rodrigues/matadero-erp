import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getColaborador, listDocumentos } from '@/actions/colaboradores';
import { AutoPrint } from '@/components/common/auto-print';
import { formatCurrency, formatDate, calculateAge } from '@/lib/utils';
import type { DocumentoColaborador } from '@/types/database';

interface Props {
  params: Promise<{ id: string }>;
}

const TIPO_LABEL: Record<string, string> = {
  dni: 'DNI',
  nie: 'NIE',
  contrato: 'Contrato',
  exame_medico: 'Exame médico',
  epi: 'EPI',
  outro: 'Outro',
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

function isImage(doc: DocumentoColaborador): boolean {
  return !!doc.mime_type?.startsWith('image/');
}

function DadosRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between gap-4 border-b border-dashed py-1.5 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 print:break-inside-avoid">
      <h2 className="mb-3 border-b-2 border-primary pb-1 text-base font-bold uppercase">{titulo}</h2>
      <div className="space-y-0">{children}</div>
    </section>
  );
}

export default async function ColaboradorPrintPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('Colaboradores');
  const [f, docsResult] = await Promise.all([getColaborador(id), listDocumentos(id)]);
  if (!f) notFound();

  const docs = docsResult.data;

  return (
    <div className="bg-white text-black">
      <AutoPrint />
      <div className="mx-auto max-w-[210mm] p-8">
        {/* Cabeçalho */}
        <header className="mb-6 flex items-end justify-between border-b-2 border-black pb-4">
          <div>
            <h1 className="text-2xl font-bold uppercase">
              {f.nombre} {f.apellido1} {f.apellido2}
            </h1>
            <p className="text-sm text-neutral-600">
              {f.categoria_profesional || 'Sem categoria'}
              {f.departamentos?.nombre ? ` · ${f.departamentos.nombre}` : ''}
            </p>
          </div>
          <div className="text-right text-xs text-neutral-600">
            <p>Emitido a {new Date().toLocaleDateString('pt-PT')}</p>
            <p>Colaborador nº {f.id.slice(0, 8)}</p>
          </div>
        </header>

        {/* Dados pessoais */}
        <Secao titulo="Dados pessoais">
          <DadosRow label="NIF" value={f.nif} />
          <DadosRow label="NIE" value={f.nie} />
          <DadosRow label="Passaporte" value={f.passaporte} />
          <DadosRow label="Nacionalidade" value={f.nacionalidad} />
          <DadosRow label="Data de nascimento" value={formatDate(f.fecha_nacimiento, 'pt-PT')} />
          <DadosRow label="Idade" value={calculateAge(f.fecha_nacimiento)} />
          <DadosRow label="Estado civil" value={f.estado_civil} />
          <DadosRow label="Sexo" value={f.sexo} />
        </Secao>

        {/* Contacto */}
        <Secao titulo="Contacto">
          <DadosRow label="Email" value={f.email} />
          <DadosRow label="Telefone" value={f.telefono} />
          <DadosRow label="Telefone emergência" value={f.telefono_emergencia} />
          <DadosRow label="Contacto emergência" value={f.contacto_emergencia} />
          <DadosRow
            label="Morada"
            value={[f.direccion, f.codigo_postal, f.ciudad, f.provincia].filter(Boolean).join(', ') || null}
          />
          <DadosRow label="País" value={f.pais} />
        </Secao>

        {/* Dados profissionais */}
        <Secao titulo="Dados profissionais">
          <DadosRow label="Data de admissão" value={formatDate(f.fecha_admision, 'pt-PT')} />
          <DadosRow label="Fim do contrato" value={f.fecha_fin_contrato ? formatDate(f.fecha_fin_contrato, 'pt-PT') : null} />
          <DadosRow label="Estado" value={f.estado} />
          <DadosRow label="Tipo de contrato" value={f.tipo_contrato} />
          <DadosRow label="Jornada" value={f.jornada} />
          <DadosRow label="Horas semanais" value={f.horas_semanales} />
          <DadosRow label="Departamento" value={f.departamentos?.nombre} />
          <DadosRow label="Categoria profissional" value={f.categoria_profesional} />
          <DadosRow label="Puesto" value={f.puesto} />
          <DadosRow label="Nível profissional" value={f.nivel_profesional} />
          <DadosRow label="Convenio" value={f.convenio_aplicable} />
          <DadosRow label="Salário base" value={formatCurrency(f.salario_base, 'pt-PT')} />
        </Secao>

        {/* Dados bancários */}
        <Secao titulo="Dados bancários">
          <DadosRow label="IBAN" value={f.iban} />
          <DadosRow label="Banco" value={f.banco_nombre} />
        </Secao>

        {/* Segurança Social */}
        <Secao titulo="Segurança Social">
          <DadosRow label="Nº Segurança Social" value={f.numero_seguridad_social} />
          <DadosRow label={t('fields.mutua')} value={f.mutua} />
        </Secao>

        {/* Documentos anexados */}
        <section className="mb-6">
          <h2 className="mb-3 border-b-2 border-primary pb-1 text-base font-bold uppercase">
            Documentos anexados ({docs.length})
          </h2>
          {docs.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhum documento anexado.</p>
          ) : (
            <ol className="space-y-6">
              {docs.map((doc) => (
                <li key={doc.id} className="print:break-inside-avoid">
                  <div className="mb-1 flex items-baseline justify-between gap-4 border-b border-dashed pb-1 text-sm">
                    <span className="font-semibold">
                      {TIPO_LABEL[doc.tipo] || doc.tipo} — {doc.nombre}
                    </span>
                    <span className="shrink-0 text-xs text-neutral-500">{formatBytes(doc.archivo_size)}</span>
                  </div>
                  {doc.descripcion && <p className="text-xs text-neutral-600">{doc.descripcion}</p>}
                  {doc.expires_at && (
                    <p className="text-xs text-neutral-600">Válido até {formatDate(doc.expires_at, 'pt-PT')}</p>
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
              ))}
            </ol>
          )}
        </section>

        <footer className="mt-8 border-t pt-2 text-center text-xs text-neutral-500">
          Documento gerado automaticamente pelo Matadero ERP — {new Date().toLocaleString('pt-PT')}
        </footer>
      </div>
    </div>
  );
}
