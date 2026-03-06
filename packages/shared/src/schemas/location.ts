import { z } from 'zod';

export const locationSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  address: z.string().min(1, 'Endereço obrigatório'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radius: z.number().positive().optional(),
});

export const locationUpdateSchema = locationSchema.partial();

export type LocationInput = z.infer<typeof locationSchema>;
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
