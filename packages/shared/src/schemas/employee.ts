import { z } from 'zod';

/** Remove não-dígitos; CPF válido tem 11 dígitos. */
export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export const cpfSchema = z
  .string()
  .optional()
  .refine((v) => !v || normalizeCpf(v).length === 0 || normalizeCpf(v).length === 11, {
    message: 'CPF deve ter 11 dígitos',
  });

export const employeeSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: cpfSchema,
  role: z.string().min(1, 'Função obrigatória'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']).default('ACTIVE'),
  unitId: z.string().uuid('Unidade inválida'),
});

export const employeeUpdateSchema = employeeSchema.partial();

export type EmployeeInput = z.infer<typeof employeeSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
