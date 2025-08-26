-- Create visitor_sessions table for tracking visits
CREATE TABLE public.visitor_sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL UNIQUE,
  user_agent TEXT,
  referrer TEXT,
  first_visit TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_visit TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  visit_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_visitor_sessions_session_id ON public.visitor_sessions(session_id);
CREATE INDEX idx_visitor_sessions_last_visit ON public.visitor_sessions(last_visit);

-- Enable RLS but make it readable for analytics
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Allow backend functions to access data
CREATE POLICY "Allow service role access to visitor_sessions" 
ON public.visitor_sessions 
FOR ALL 
TO service_role 
USING (true);

-- Allow public read access for analytics (optional - can remove if you want private analytics)
CREATE POLICY "Allow public read access to visitor_sessions" 
ON public.visitor_sessions 
FOR SELECT 
TO anon 
USING (true);