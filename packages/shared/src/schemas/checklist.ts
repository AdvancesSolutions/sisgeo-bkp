import { z } from 'zod';

export const checklistInputTypeEnum = z.enum(['CHECKBOX', 'PHOTO', 'TEXT']);

export const checklistItemSchema = z.object({
  cleaningTypeId: z.string().uuid(),
  label: z.string().min(1, 'Label obrigatório'),
  inputType: checklistInputTypeEnum,
  isRequired: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  procedimentoId: z.string().uuid().optional().nullable(),
});

export const checklistItemUpdateSchema = checklistItemSchema.partial().omit({ cleaningTypeId: true });

export const taskChecklistResponseSchema = z.object({
  checklistItemId: z.string().uuid(),
  valueBool: z.boolean().optional().nullable(),
  valueText: z.string().optional().nullable(),
});

export type ChecklistItemInput = z.infer<typeof checklistItemSchema>;
export type ChecklistItemUpdateInput = z.infer<typeof checklistItemUpdateSchema>;
export type TaskChecklistResponseInput = z.infer<typeof taskChecklistResponseSchema>;
