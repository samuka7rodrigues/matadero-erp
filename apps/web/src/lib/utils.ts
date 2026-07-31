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
  const number = (() => {
    if (first === 'X') return 0;
    if (first === 'Y') return 1;
    if (first === 'Z') return 2;
    return parseInt(nif.substring(0, 8), 10);
  })();
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
