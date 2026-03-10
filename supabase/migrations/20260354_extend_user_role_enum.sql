-- ═══════════════════════════════════════════════════════════
-- Migration: extend user_role enum with 'contractor' value
-- ═══════════════════════════════════════════════════════════

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'contractor';
