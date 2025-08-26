-- Add status and winning_code columns to wheel_spins table
ALTER TABLE public.wheel_spins 
ADD COLUMN status VARCHAR(10) NOT NULL DEFAULT 'loss',
ADD COLUMN winning_code VARCHAR(255);

-- Add constraint for valid status values
ALTER TABLE public.wheel_spins 
ADD CONSTRAINT check_status_valid 
CHECK (status IN ('win', 'loss'));

-- Add index for better performance on status queries
CREATE INDEX idx_wheel_spins_status ON public.wheel_spins(status);
CREATE INDEX idx_wheel_spins_shotguner_id ON public.wheel_spins(shotguner_id);