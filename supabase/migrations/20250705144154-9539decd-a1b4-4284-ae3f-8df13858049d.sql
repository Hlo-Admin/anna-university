
-- Create table for paper submissions
CREATE TABLE public.paper_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  company TEXT,
  message TEXT NOT NULL,
  document_url TEXT,
  document_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'selected', 'rejected')),
  assigned_to UUID,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for reviewers
CREATE TABLE public.reviewers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'reviewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint for assigned_to after both tables are created
ALTER TABLE public.paper_submissions 
ADD CONSTRAINT fk_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES public.reviewers(id);

-- Enable RLS on both tables
ALTER TABLE public.paper_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviewers ENABLE ROW LEVEL SECURITY;

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

-- RLS policies for reviewers
CREATE POLICY "Admins can manage reviewers" 
  ON public.reviewers 
  FOR ALL 
  USING (true);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

-- Storage policies for documents bucket
CREATE POLICY "Anyone can upload documents" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can view documents" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'documents');
