
-- Add submission_id column to store human-readable IDs like IEC001, IEC002, etc.
ALTER TABLE public.paper_submissions 
ADD COLUMN submission_id TEXT;

-- Add remarks column for reviewer comments
ALTER TABLE public.paper_submissions 
ADD COLUMN remarks TEXT;

-- Create a function to generate submission IDs automatically
CREATE OR REPLACE FUNCTION generate_submission_id()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    submission_id TEXT;
BEGIN
    -- Get the next sequential number
    SELECT COALESCE(MAX(CAST(SUBSTRING(submission_id FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM paper_submissions
    WHERE submission_id IS NOT NULL AND submission_id ~ '^IEC[0-9]+$';
    
    -- Format as IEC001, IEC002, etc.
    submission_id := 'IEC' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically generate submission_id for new submissions
CREATE OR REPLACE FUNCTION set_submission_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.submission_id IS NULL THEN
        NEW.submission_id := generate_submission_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_set_submission_id ON public.paper_submissions;
CREATE TRIGGER trigger_set_submission_id
    BEFORE INSERT ON public.paper_submissions
    FOR EACH ROW
    EXECUTE FUNCTION set_submission_id();

-- Update existing submissions to have submission IDs
DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 1;
BEGIN
    FOR rec IN SELECT id FROM paper_submissions WHERE submission_id IS NULL ORDER BY submitted_at
    LOOP
        UPDATE paper_submissions 
        SET submission_id = 'IEC' || LPAD(counter::TEXT, 3, '0')
        WHERE id = rec.id;
        counter := counter + 1;
    END LOOP;
END $$;
