/**
 * Tipos para a camada de API.
 * Padroniza respostas e erros da API.
 */

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError };
