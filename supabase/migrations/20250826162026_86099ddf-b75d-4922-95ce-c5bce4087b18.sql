-- Remove shotguner_id columns from tables since webhook no longer provides this
ALTER TABLE public.wheel_spins DROP COLUMN shotguner_id;
ALTER TABLE public.winning_codes DROP COLUMN shotguner_id;

-- Update assign_winning_code function to only use email (remove shotguner_id parameter)
CREATE OR REPLACE FUNCTION public.assign_winning_code(p_code text, p_shotguner_email character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  updated_rows INTEGER;
BEGIN
  UPDATE public.winning_codes 
  SET 
    shotguner_email = p_shotguner_email,
    assigned_at = NOW()
  WHERE 
    code = p_code 
    AND shotguner_email IS NULL;
    
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  
  RETURN updated_rows > 0;
END;
$function$;

-- Update user_has_winning_code function to use email instead of id
CREATE OR REPLACE FUNCTION public.user_has_winning_code(p_shotguner_email character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  code_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO code_count 
  FROM public.winning_codes 
  WHERE shotguner_email = p_shotguner_email;
  
  RETURN code_count > 0;
END;
$function$;