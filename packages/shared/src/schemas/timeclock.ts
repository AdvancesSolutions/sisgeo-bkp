import { z } from 'zod';

export const timeClockSchema = z.object({
  type: z.enum(['CHECKIN', 'CHECKOUT']),
  employeeId: z.string().uuid().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type TimeClockInput = z.infer<typeof timeClockSchema>;
