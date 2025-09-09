-- Create wheel_spins table to track lottery spins
CREATE TABLE public.wheel_spins (
  id BIGSERIAL PRIMARY KEY,
  shotguner_id INTEGER NOT NULL,
  shotguner_email VARCHAR(255) NOT NULL,
  wheel_spinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate spins per user
ALTER TABLE
  public.wheel_spins
ADD
  CONSTRAINT unique_shotguner_id UNIQUE (shotguner_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wheel_spins_shotguner_id ON public.wheel_spins (shotguner_id);

CREATE INDEX IF NOT EXISTS idx_wheel_spins_shotguner_email ON public.wheel_spins (shotguner_email);

CREATE INDEX IF NOT EXISTS idx_wheel_spins_spinned_at ON public.wheel_spins (wheel_spinned_at);

-- Enable Row Level Security
ALTER TABLE
  public.wheel_spins ENABLE ROW LEVEL SECURITY;

-- Create restrictive RLS policy - only allow backend operations
-- This prevents direct client access and forces all operations through Edge Functions
CREATE POLICY "Backend only access to wheel_spins" ON public.wheel_spins FOR ALL USING (false);