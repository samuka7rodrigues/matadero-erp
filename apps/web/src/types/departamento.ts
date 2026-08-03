import { z } from 'zod';

export const departamentoSchema = z.object({
  nombre: z.string().trim().min(1, 'Nome é obrigatório'),
  codigo: z.string().trim().min(1, 'Código é obrigatório').toUpperCase(),
  descripcion: z.string().trim().optional(),
  activo: z.boolean().optional().default(true),
});

export type DepartamentoFormData = z.infer<typeof departamentoSchema>;
