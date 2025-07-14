
-- First check what values are currently allowed
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'paper_submissions_submission_type_check';

-- Update the check constraint to allow the correct submission types
ALTER TABLE public.paper_submissions 
DROP CONSTRAINT IF EXISTS paper_submissions_submission_type_check;

ALTER TABLE public.paper_submissions 
ADD CONSTRAINT paper_submissions_submission_type_check 
CHECK (submission_type IN ('extended-abstract', 'fullpaper'));
