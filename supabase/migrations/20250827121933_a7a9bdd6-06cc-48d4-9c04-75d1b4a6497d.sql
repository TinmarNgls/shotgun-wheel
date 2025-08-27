-- Remove public read access to visitor_sessions table
DROP POLICY IF EXISTS "Allow public read access to visitor_sessions" ON public.visitor_sessions;

-- Create a secure function to get analytics data without exposing raw visitor data
CREATE OR REPLACE FUNCTION public.get_visitor_analytics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_sessions INTEGER;
  total_visits INTEGER;
  recent_sessions INTEGER;
  result JSON;
BEGIN
  -- Get total unique sessions
  SELECT COUNT(*) INTO total_sessions FROM public.visitor_sessions;
  
  -- Get total visits (sum of all visit counts)
  SELECT COALESCE(SUM(visit_count), 0) INTO total_visits FROM public.visitor_sessions;
  
  -- Get recent sessions (last 24 hours)
  SELECT COUNT(*) INTO recent_sessions 
  FROM public.visitor_sessions 
  WHERE last_visit >= NOW() - INTERVAL '24 hours';
  
  -- Return aggregated data as JSON
  result := json_build_object(
    'total_sessions', total_sessions,
    'total_visits', total_visits,
    'recent_sessions', recent_sessions
  );
  
  RETURN result;
END;
$$;