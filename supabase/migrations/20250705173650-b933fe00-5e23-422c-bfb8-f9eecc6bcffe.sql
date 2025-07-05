
-- Drop the existing table and recreate with proper structure
DROP TABLE IF EXISTS public.paper_submissions;

-- Create the new paper_submissions table with separate fields
CREATE TABLE public.paper_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('abstract', 'fullpaper')),
  author_name TEXT NOT NULL,
  co_author_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_country_code TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  whatsapp_country_code TEXT,
  whatsapp_number TEXT,
  paper_title TEXT NOT NULL,
  institution TEXT NOT NULL,
  designation TEXT NOT NULL,
  department TEXT NOT NULL,
  presentation_mode TEXT NOT NULL CHECK (presentation_mode IN ('oral', 'poster', 'virtual', 'video')),
  journal_publication TEXT NOT NULL CHECK (journal_publication IN ('yes', 'no')),
  message TEXT,
  document_url TEXT,
  document_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'selected', 'rejected')),
  assigned_to UUID REFERENCES public.reviewers(id),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the table
ALTER TABLE public.paper_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for paper_submissions
CREATE POLICY "Admins can view all submissions" 
  ON public.paper_submissions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can update submissions" 
  ON public.paper_submissions 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can insert submissions" 
  ON public.paper_submissions 
  FOR INSERT 
  WITH CHECK (true);
