export interface ColaboradorOpt {
  id?: string;
  nombre: string | null;
  apellido1: string | null;
  apellido2: string | null;
}

export interface VehiculoOpt {
  id: string;
  matricula: string;
  marca: string | null;
  modelo: string | null;
}

export function vehiculoLabel(v?: VehiculoOpt | null): string {
  if (!v) return '—';
  return [v.matricula, v.marca, v.modelo].filter(Boolean).join(' · ');
}

export function nomeColaborador(c?: ColaboradorOpt | null): string {
  if (!c) return '—';
  return [c.nombre, c.apellido1, c.apellido2].filter(Boolean).join(' ');
}

export function formatImporte(value: number | null): string {
  return value != null ? `${value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €` : '—';
}

export function formatKm(value: number | null | undefined): string {
  return value != null ? `${value.toLocaleString('pt-PT')} km` : '—';
}
