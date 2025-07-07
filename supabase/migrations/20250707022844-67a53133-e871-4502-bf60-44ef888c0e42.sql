
-- Add is_active column to reviewers table to allow admins to deactivate reviewers
ALTER TABLE public.reviewers 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Add index for better performance when filtering active reviewers
CREATE INDEX idx_reviewers_is_active ON public.reviewers(is_active);
