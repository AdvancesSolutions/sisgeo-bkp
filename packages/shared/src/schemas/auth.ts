import { z } from 'zod';

/** Perfis: Auxiliar (execução), Supervisor (validação), Administrador (gestão completa) */
export const roleEnum = z.enum(['ADMIN', 'SUPERVISOR', 'AUXILIAR', 'FUNCIONARIO']);
export type Role = z.infer<typeof roleEnum>;

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token obrigatório'),
});

export const createEmployeeAccessSchema = z.object({
  employeeId: z.string().uuid('ID do funcionário inválido'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});
export type CreateEmployeeAccessInput = z.infer<typeof createEmployeeAccessSchema>;

export const resetEmployeeAccessSchema = z.object({
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});
export type ResetEmployeeAccessInput = z.infer<typeof resetEmployeeAccessSchema>;

export const rejectTaskSchema = z.object({
  comment: z.string().min(1, 'Comentário obrigatório na recusa'),
  reason: z.string().optional(),
});
export type RejectTaskInput = z.infer<typeof rejectTaskSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token obrigatório'),
  newPassword: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
