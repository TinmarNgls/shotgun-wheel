-- Add status and winning_code columns to wheel_spins table
ALTER TABLE
    public.wheel_spins
ADD
    COLUMN IF NOT EXISTS status VARCHAR(10) NOT NULL DEFAULT 'loss',
ADD
    COLUMN IF NOT EXISTS winning_code VARCHAR(255);

-- Add constraint for valid status values
ALTER TABLE
    public.wheel_spins DROP CONSTRAINT IF EXISTS check_status_valid;

ALTER TABLE
    public.wheel_spins
ADD
    CONSTRAINT check_status_valid CHECK (status IN ('win', 'loss'));

-- Add index for better performance on status queries (shotguner_id index likely already exists)
CREATE INDEX IF NOT EXISTS idx_wheel_spins_status ON public.wheel_spins(status);