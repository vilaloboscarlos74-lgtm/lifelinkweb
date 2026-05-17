-- LifeLink — Migración: nuevos campos para verificación de email y 2FA
-- Ejecutar en PostgreSQL con: psql -U postgres -d lifelink_db -f add_new_fields.sql

-- Verificación de email
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP WITH TIME ZONE;
CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email_verification_token
    ON users (email_verification_token) WHERE email_verification_token IS NOT NULL;

-- 2FA TOTP
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT false;
