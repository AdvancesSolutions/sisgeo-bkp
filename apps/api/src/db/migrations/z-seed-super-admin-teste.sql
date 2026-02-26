-- Cria usuário Super Admin Teste (super@empresa.com / super123) para testar acesso.
INSERT INTO users (id, name, email, role, password_hash, created_at, updated_at)
VALUES (
  'a1b2c3d4-e5f6-4789-a012-3456789abcde',
  'Super Admin Teste',
  'super@empresa.com',
  'SUPER_ADMIN',
  '$2b$10$EFaGz65Re95VY7H1PywIvOWk95ZA2.ZvZAgIjN7I13WUbSbHeEMfC',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'SUPER_ADMIN',
  name = 'Super Admin Teste',
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();
