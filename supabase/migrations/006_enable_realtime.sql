-- Migration 006: Enable Supabase Realtime Publication for live_sessions
-- Ensures Postgres Changes (INSERT/UPDATE) on live_sessions table broadcast websocket events to connected apps

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_sessions;
