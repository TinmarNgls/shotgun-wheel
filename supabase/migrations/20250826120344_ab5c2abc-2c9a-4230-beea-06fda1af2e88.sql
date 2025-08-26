-- Add new columns to winning_codes table
ALTER TABLE public.winning_codes 
ADD COLUMN amount decimal(10,2) DEFAULT 5.00,
ADD COLUMN currency varchar(3) DEFAULT 'EUR',
ADD COLUMN expiration_date timestamp with time zone DEFAULT '2025-12-01 00:00:00+00';

-- Update existing records with the specified default values
UPDATE public.winning_codes 
SET 
  amount = 5.00,
  currency = 'EUR',
  expiration_date = '2025-12-01 00:00:00+00'
WHERE amount IS NULL OR currency IS NULL OR expiration_date IS NULL;