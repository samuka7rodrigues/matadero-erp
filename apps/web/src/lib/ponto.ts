import { formatInTimeZone } from 'date-fns-tz';

// Fuso horário do matadouro (Espanha). Usado para limites do dia e RPC.
export const TIMEZONE = 'Europe/Madrid';

/** Data atual no fuso do matadouro, no formato yyyy-MM-dd. */
export function dataHojeTimezone(): string {
  return formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');
}
