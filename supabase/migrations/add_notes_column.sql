-- Migration: Add notes column to events table
-- Date: 2026-01-19
-- Run this in Supabase SQL Editor

ALTER TABLE events ADD COLUMN IF NOT EXISTS notes TEXT;
