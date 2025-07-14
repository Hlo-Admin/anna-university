
-- Update the check constraint to allow the new submission types
ALTER TABLE public.paper_submissions 
DROP CONSTRAINT paper_submissions_submission_type_check;

ALTER TABLE public.paper_submissions 
ADD CONSTRAINT paper_submissions_submission_type_check 
CHECK (submission_type IN ('extended-abstract', 'fullpaper'));
