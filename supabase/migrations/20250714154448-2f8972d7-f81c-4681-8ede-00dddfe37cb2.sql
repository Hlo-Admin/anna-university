
-- First, let's see what submission_type values currently exist in the table
SELECT DISTINCT submission_type FROM public.paper_submissions;

-- Check current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'paper_submissions_submission_type_check';

-- Update any existing 'abstract' values to 'extended-abstract' to match our new constraint
UPDATE public.paper_submissions 
SET submission_type = 'extended-abstract' 
WHERE submission_type = 'abstract';

-- Now drop and recreate the constraint
ALTER TABLE public.paper_submissions 
DROP CONSTRAINT IF EXISTS paper_submissions_submission_type_check;

ALTER TABLE public.paper_submissions 
ADD CONSTRAINT paper_submissions_submission_type_check 
CHECK (submission_type IN ('extended-abstract', 'fullpaper'));
