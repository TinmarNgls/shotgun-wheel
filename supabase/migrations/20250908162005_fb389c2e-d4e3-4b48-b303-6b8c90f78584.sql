-- Test and strengthen RLS policies for sensitive tables
-- The current policies use 'false' but let's make them explicitly restrictive

-- Drop existing policies and create more explicit ones
DROP POLICY IF EXISTS "Backend only access to rewards" ON public.rewards;
DROP POLICY IF EXISTS "Backend only access to wheel_spins" ON public.wheel_spins;

-- Create stricter policies that explicitly deny all public access
CREATE POLICY "deny_all_public_access_rewards" 
ON public.rewards
FOR ALL 
TO public
USING (false)
WITH CHECK (false);

CREATE POLICY "deny_all_public_access_wheel_spins" 
ON public.wheel_spins
FOR ALL 
TO public  
USING (false)
WITH CHECK (false);

-- Create policies that only allow service_role access
CREATE POLICY "service_role_only_rewards" 
ON public.rewards
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "service_role_only_wheel_spins" 
ON public.wheel_spins
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled (should already be enabled)
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheel_spins ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners as well (extra security)
ALTER TABLE public.rewards FORCE ROW LEVEL SECURITY;
ALTER TABLE public.wheel_spins FORCE ROW LEVEL SECURITY;