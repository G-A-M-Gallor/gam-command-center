-- Migration: drop vb_ai_memory
-- Task: CLEANUP4
-- Reason: Table created in 20260356 but never used by any application code.
-- RLS policies from 20260372 are also removed via CASCADE.

DROP TABLE IF EXISTS vb_ai_memory CASCADE;
