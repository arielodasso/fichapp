-- Esquema de base de datos — Fichero de Empleados y Obras
-- PostgreSQL. Migraciones idempotentes (seguras de re-ejecutar).
-- TASK-002 · REQ-011

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'EMPLOYEE'
                CHECK (role IN ('ADMIN', 'EMPLOYEE')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS empleados (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL,
  apellido   TEXT NOT NULL,
  documento  TEXT NOT NULL UNIQUE,
  rol        TEXT NOT NULL DEFAULT 'OBRERO',
  activo     BOOLEAN NOT NULL DEFAULT true,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS obras (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  estado      TEXT NOT NULL DEFAULT 'ACTIVA'
              CHECK (estado IN ('ACTIVA', 'PAUSADA', 'FINALIZADA')),
  activo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS periodos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id    UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  obra_id        UUID NOT NULL REFERENCES obras(id) ON DELETE RESTRICT,
  ingreso_at     TIMESTAMPTZ NOT NULL,
  egreso_at      TIMESTAMPTZ,
  corregido      BOOLEAN NOT NULL DEFAULT false,
  corregido_por  UUID REFERENCES users(id) ON DELETE SET NULL,
  corregido_en   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Corrección de períodos (REQ-012): soft-delete con registro de quién y cuándo.
ALTER TABLE periodos ADD COLUMN IF NOT EXISTS eliminado BOOLEAN NOT NULL DEFAULT false;

-- Índice único parcial: impide a nivel de base de datos que un empleado
-- tenga más de un período abierto a la vez (anti doble fichada, REQ-006).
-- Los períodos eliminados no cuentan como abiertos.
DROP INDEX IF EXISTS idx_periodos_abierto_unico;
CREATE UNIQUE INDEX IF NOT EXISTS idx_periodos_abierto_unico
  ON periodos (empleado_id)
  WHERE egreso_at IS NULL AND eliminado = false;

CREATE INDEX IF NOT EXISTS idx_periodos_empleado   ON periodos (empleado_id);
CREATE INDEX IF NOT EXISTS idx_periodos_obra_ingreso ON periodos (obra_id, ingreso_at);
CREATE INDEX IF NOT EXISTS idx_periodos_rango      ON periodos (ingreso_at, egreso_at);
