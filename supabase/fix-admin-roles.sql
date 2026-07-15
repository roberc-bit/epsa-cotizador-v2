-- Corregir roles admin y asegurar que las familias existen
-- Correr en: Supabase → SQL Editor → New query → Run

-- Asegurar rol admin para ambos usuarios
UPDATE perfiles
SET rol = 'admin', activo = true
WHERE email IN ('condorellirober@gmail.com', 'rober.condorelli@volvo.com');

-- Verificar resultado
SELECT email, rol, activo FROM perfiles ORDER BY created_at;

-- Verificar familias
SELECT slug, nombre, activo FROM familias ORDER BY orden;
