-- Ejecutar en PostgreSQL (Neon) para agregar las nuevas columnas.
-- Usar en el SQL Editor de Neon, sección por sección.

-- 1. Columnas de 2FA por SMS en la tabla users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS sms_2fa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS sms_otp VARCHAR(6),
    ADD COLUMN IF NOT EXISTS sms_otp_expires TIMESTAMPTZ;

-- 2. Nuevo valor en el enum de tipo de insumo
ALTER TYPE supplytype ADD VALUE IF NOT EXISTS 'solicitud';

-- 3. Columnas de presupuesto en la tabla supplies
ALTER TABLE supplies
    ADD COLUMN IF NOT EXISTS budget_min FLOAT,
    ADD COLUMN IF NOT EXISTS budget_max FLOAT;

-- Las tablas blood_donor_records y blood_donations
-- se crean automáticamente con create_all al iniciar la app.
