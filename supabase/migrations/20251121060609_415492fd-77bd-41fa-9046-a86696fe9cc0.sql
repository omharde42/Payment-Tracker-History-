-- Create table to track login attempts and lockouts
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  last_failed_at TIMESTAMP WITH TIME ZONE,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create unique index on email for faster lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only allow the service to manage this table (no direct user access)
CREATE POLICY "Service role can manage login attempts"
  ON public.login_attempts
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create function to clean up old records (optional, for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete records older than 30 days where account is not locked
  DELETE FROM public.login_attempts
  WHERE updated_at < now() - INTERVAL '30 days'
    AND (locked_until IS NULL OR locked_until < now());
END;
$$;