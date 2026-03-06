import { z } from 'zod';

export const photoTypeEnum = z.enum(['BEFORE', 'AFTER']);

export const photoMetadataSchema = z.object({
  serviceRecordId: z.string().uuid(),
  type: photoTypeEnum,
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export type PhotoMetadataInput = z.infer<typeof photoMetadataSchema>;
