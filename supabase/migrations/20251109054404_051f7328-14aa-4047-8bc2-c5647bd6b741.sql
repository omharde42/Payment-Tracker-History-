-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  person_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('given', 'taken', 'left_to_give')),
  note TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create archived_transactions table for monthly archives
CREATE TABLE public.archived_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  person_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL,
  note TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archive_month DATE NOT NULL -- Stores the month this archive belongs to (YYYY-MM-01)
);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" 
ON public.transactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for archived_transactions (read-only for users)
CREATE POLICY "Users can view their own archived transactions" 
ON public.archived_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on transactions
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX idx_archived_transactions_user_id ON public.archived_transactions(user_id);
CREATE INDEX idx_archived_transactions_archive_month ON public.archived_transactions(archive_month);
CREATE INDEX idx_archived_transactions_user_month ON public.archived_transactions(user_id, archive_month);

-- Create function to archive previous month's transactions
CREATE OR REPLACE FUNCTION public.archive_previous_month_transactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  previous_month_start DATE;
  previous_month_end DATE;
BEGIN
  -- Calculate the start and end of the previous month
  previous_month_start := date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::DATE;
  previous_month_end := (date_trunc('month', CURRENT_DATE) - INTERVAL '1 day')::DATE;
  
  -- Copy transactions from previous month to archived_transactions
  INSERT INTO public.archived_transactions (
    id,
    user_id,
    person_name,
    amount,
    type,
    note,
    date,
    created_at,
    updated_at,
    archive_month
  )
  SELECT 
    id,
    user_id,
    person_name,
    amount,
    type,
    note,
    date,
    created_at,
    updated_at,
    previous_month_start -- Store as YYYY-MM-01 format
  FROM public.transactions
  WHERE date >= previous_month_start 
    AND date <= previous_month_end
  ON CONFLICT (id) DO NOTHING; -- Skip if already archived
  
  -- Note: We keep transactions in the main table for current month access
  -- Optionally, you could delete old transactions here if you want:
  -- DELETE FROM public.transactions WHERE date < previous_month_start;
END;
$$;

-- Create a manual archive function that users can call via edge function
CREATE OR REPLACE FUNCTION public.archive_month_transactions(target_month DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  month_start DATE;
  month_end DATE;
BEGIN
  -- Calculate the start and end of the target month
  month_start := date_trunc('month', target_month)::DATE;
  month_end := (date_trunc('month', target_month) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Copy transactions from target month to archived_transactions
  INSERT INTO public.archived_transactions (
    id,
    user_id,
    person_name,
    amount,
    type,
    note,
    date,
    created_at,
    updated_at,
    archive_month
  )
  SELECT 
    id,
    user_id,
    person_name,
    amount,
    type,
    note,
    date,
    created_at,
    updated_at,
    month_start
  FROM public.transactions
  WHERE date >= month_start 
    AND date <= month_end
  ON CONFLICT (id) DO NOTHING;
END;
$$;