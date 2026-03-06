-- Garante que admin@empresa.com tenha role SUPER_ADMIN (evita 403 no frontend).
UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'admin@empresa.com' AND (role IS NULL OR role != 'SUPER_ADMIN');
