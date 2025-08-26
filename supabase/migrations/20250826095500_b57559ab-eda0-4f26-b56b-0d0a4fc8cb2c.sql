-- Fix security warnings by adding search_path to functions

-- Update generate_random_code function
CREATE OR REPLACE FUNCTION generate_random_code(length INTEGER DEFAULT 10)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql 
SET search_path = public;

-- Update get_available_winning_code function
CREATE OR REPLACE FUNCTION get_available_winning_code()
RETURNS TEXT AS $$
DECLARE
  available_code TEXT;
BEGIN
  SELECT code INTO available_code 
  FROM public.winning_codes 
  WHERE shotguner_id IS NULL 
  ORDER BY id 
  LIMIT 1;
  
  RETURN available_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Update assign_winning_code function
CREATE OR REPLACE FUNCTION assign_winning_code(
  p_code TEXT,
  p_shotguner_id INTEGER,
  p_shotguner_email VARCHAR(255)
)
RETURNS BOOLEAN AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  UPDATE public.winning_codes 
  SET 
    shotguner_id = p_shotguner_id,
    shotguner_email = p_shotguner_email,
    assigned_at = NOW()
  WHERE 
    code = p_code 
    AND shotguner_id IS NULL;
    
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  
  RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Update user_has_winning_code function
CREATE OR REPLACE FUNCTION user_has_winning_code(p_shotguner_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  code_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO code_count 
  FROM public.winning_codes 
  WHERE shotguner_id = p_shotguner_id;
  
  RETURN code_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;