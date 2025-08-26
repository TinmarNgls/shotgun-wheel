-- Create winning_codes table to store winning codes for lottery
CREATE TABLE public.winning_codes (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  shotguner_email VARCHAR(255),
  shotguner_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_at TIMESTAMPTZ
);

-- Add constraint to ensure both shotguner fields are set together or both null
ALTER TABLE public.winning_codes 
ADD CONSTRAINT check_shotguner_data_consistency 
CHECK (
  (shotguner_email IS NULL AND shotguner_id IS NULL) OR 
  (shotguner_email IS NOT NULL AND shotguner_id IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX idx_winning_codes_shotguner_id ON public.winning_codes (shotguner_id);
CREATE INDEX idx_winning_codes_shotguner_email ON public.winning_codes (shotguner_email);
CREATE INDEX idx_winning_codes_assigned_at ON public.winning_codes (assigned_at);
CREATE INDEX idx_winning_codes_unassigned ON public.winning_codes (id) WHERE shotguner_id IS NULL;

-- Enable Row Level Security
ALTER TABLE public.winning_codes ENABLE ROW LEVEL SECURITY;

-- Create restrictive RLS policy - only allow backend operations
CREATE POLICY "Backend only access to winning_codes" 
ON public.winning_codes 
FOR ALL 
USING (false);

-- Function to generate random alphanumeric code
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
$$ LANGUAGE plpgsql;

-- Function to get an available winning code
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign a winning code to a user
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user already has a winning code
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert 50 random winning codes
DO $$
DECLARE
  i INTEGER;
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  FOR i IN 1..50 LOOP
    LOOP
      new_code := generate_random_code(10);
      
      -- Check if code already exists
      SELECT EXISTS(SELECT 1 FROM public.winning_codes WHERE code = new_code) INTO code_exists;
      
      -- If code doesn't exist, insert it and break the loop
      IF NOT code_exists THEN
        INSERT INTO public.winning_codes (code) VALUES (new_code);
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;