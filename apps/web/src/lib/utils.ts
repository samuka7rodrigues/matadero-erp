import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, locale: string = 'pt-BR'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'short' }).format(d);
}

export function formatCurrency(value: number, locale: string = 'pt-BR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

export function isValidNIF(nif: string): boolean {
  if (!/^[0-9XYZ][0-9]{6,7}[A-Z]$/.test(nif)) return false;
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const first = nif.charAt(0);
  // NIE (X/Y/Z): a letra calcula-se a partir do dígito mapeado (X→0, Y→1, Z→2)
  // seguido dos 7 dígitos. Ex: Y0719810 → 1 + 0719810 = 10719810.
  const number =
    first === 'X' || first === 'Y' || first === 'Z'
      ? parseInt({ X: '0', Y: '1', Z: '2' }[first] + nif.substring(1, 8), 10)
      : parseInt(nif.substring(0, 8), 10);
  const expected = letters[number % 23];
  return expected === nif.charAt(8);
}

export function isValidCIF(cif: string): boolean {
  return /^[A-HJNP-SUVW][0-9]{7}[A-J0-9]$/.test(cif);
}

export function calculateAge(birthDate: Date | string): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/**
 * Verifica se um item de navegação está ativo para o pathname atual.
 * Compara segmentos (não substrings) para evitar falsos positivos
 * tipo `/colaborador-singular` dar match com `/colaboradores`.
 *
 * Exemplo: se `currentPath = '/pt-BR/colaboradores/123'` e `itemHref = '/colaboradores'`,
 * queremos true porque o usuário está dentro da secção colaboradores.
 */
export function isNavItemActive(currentPath: string, itemHref: string): boolean {
  if (!currentPath || !itemHref) return false;

  // Remove o locale prefixo do currentPath (ex: /pt-BR/colaboradores → /colaboradores)
  const segments = currentPath.split('/').filter(Boolean);
  const pathWithoutLocale = segments.length > 1 ? '/' + segments.slice(1).join('/') : '/';

  // Comparação exacta na home, ou "startsWith" para sub-rotas
  if (pathWithoutLocale === itemHref) return true;
  if (pathWithoutLocale.startsWith(itemHref + '/')) return true;

  return false;
}
