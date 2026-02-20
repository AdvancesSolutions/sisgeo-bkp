import { z } from 'zod';

/** Pendente, Em execução, Concluída, Atrasada, Reprovada + IN_REVIEW (validação) */
export const taskStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'LATE', 'REJECTED']);

const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;

export const taskSchema = z.object({
  areaId: z.string().uuid('Área inválida'),
  employeeId: z.string().uuid().optional(),
  scheduledDate: z.coerce.date(),
  scheduledTime: z.string().regex(timeRegex, 'Horário inválido (HH:mm)').optional(),
  status: taskStatusEnum.default('PENDING'),
  title: z.string().optional(),
  description: z.string().optional(),
});

export const taskUpdateSchema = taskSchema.partial();

export type TaskInput = z.infer<typeof taskSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
