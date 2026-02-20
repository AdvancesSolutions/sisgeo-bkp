import { z } from 'zod';

export const riskClassificationEnum = z.enum(['CRITICO', 'SEMICRITICO', 'NAO_CRITICO']);
export type RiskClassification = z.infer<typeof riskClassificationEnum>;

export const areaSchema = z.object({
  locationId: z.string().uuid('Local inválido'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  riskClassification: riskClassificationEnum.optional().nullable(),
  cleaningFrequency: z.string().max(50).optional().nullable(),
});

export const areaUpdateSchema = areaSchema.partial().omit({ locationId: true });

export type AreaInput = z.infer<typeof areaSchema>;
export type AreaUpdateInput = z.infer<typeof areaUpdateSchema>;
