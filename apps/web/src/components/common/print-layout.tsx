'use client';

export function PrintHeader({
  titulo,
  subtitulo,
  referencia,
}: {
  titulo: string;
  subtitulo?: string;
  referencia: string;
}) {
  return (
    <header className="mb-6 flex items-end justify-between border-b-2 border-black pb-4 print:break-inside-avoid">
      <div>
        <h1 className="text-2xl font-bold uppercase">{titulo}</h1>
        {subtitulo && <p className="text-sm text-neutral-600">{subtitulo}</p>}
      </div>
      <div className="text-right text-xs text-neutral-600">
        <p>Emitido a {new Date().toLocaleDateString('pt-PT')}</p>
        <p>{referencia}</p>
      </div>
    </header>
  );
}

export function PrintSection({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 print:break-inside-avoid">
      <h2 className="mb-3 border-b-2 border-primary pb-1 text-base font-bold uppercase">{titulo}</h2>
      <div className="space-y-0">{children}</div>
    </section>
  );
}

export function PrintRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between gap-4 border-b border-dashed py-1.5 text-sm">
      <span className="font-medium text-neutral-500">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

export function PrintFooter() {
  return (
    <footer className="mt-8 border-t pt-2 text-center text-xs text-neutral-500">
      Documento gerado automaticamente pelo Matadero ERP — {new Date().toLocaleString('pt-PT')}
    </footer>
  );
}
