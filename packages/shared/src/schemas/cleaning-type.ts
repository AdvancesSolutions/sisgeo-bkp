import { z } from 'zod';

export const cleaningTypeSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional().nullable(),
});

export const cleaningTypeUpdateSchema = cleaningTypeSchema.partial();

export type CleaningTypeInput = z.infer<typeof cleaningTypeSchema>;
export type CleaningTypeUpdateInput = z.infer<typeof cleaningTypeUpdateSchema>;
