-- Ejecutar en PostgreSQL para agregar las nuevas columnas
-- Solo necesario si la base de datos ya existe.

-- Columnas de 2FA por SMS en la tabla users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS sms_2fa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS sms_otp VARCHAR(6),
    ADD COLUMN IF NOT EXISTS sms_otp_expires TIMESTAMPTZ;

-- Las tablas blood_donor_records y blood_donations
-- se crean automáticamente con create_all al iniciar la app.
