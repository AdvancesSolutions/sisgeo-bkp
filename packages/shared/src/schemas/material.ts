import { z } from 'zod';

export const materialSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  unit: z.string().min(1, 'Unidade obrigatória (ex: un, kg, L)'),
  stock: z.number().int().min(0).default(0),
});

export const materialUpdateSchema = materialSchema.partial();

export const stockMovementSchema = z.object({
  materialId: z.string().uuid('Material inválido'),
  type: z.enum(['IN', 'OUT']),
  qty: z.number().int().positive('Quantidade deve ser positiva'),
  ref: z.string().optional(),
});

export const materialCommentSchema = z.object({
  body: z.string().min(1, 'Comentário não pode ser vazio').max(2000, 'Máximo 2000 caracteres'),
});

export type MaterialInput = z.infer<typeof materialSchema>;
export type MaterialUpdateInput = z.infer<typeof materialUpdateSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
export type MaterialCommentInput = z.infer<typeof materialCommentSchema>;
