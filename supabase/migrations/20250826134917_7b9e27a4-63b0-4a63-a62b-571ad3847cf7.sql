-- Add spin tracking to visitor_sessions table
ALTER TABLE public.visitor_sessions 
ADD COLUMN spin_attempts JSONB DEFAULT '[]'::jsonb;

-- Add index for better performance on spin tracking
CREATE INDEX idx_visitor_sessions_spin_attempts ON public.visitor_sessions USING GIN(spin_attempts);