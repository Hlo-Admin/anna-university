
-- Fix the ambiguous column reference in the generate_submission_id function
CREATE OR REPLACE FUNCTION generate_submission_id()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    new_submission_id TEXT;
BEGIN
    -- Get the next sequential number - explicitly reference the table column
    SELECT COALESCE(MAX(CAST(SUBSTRING(paper_submissions.submission_id FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM paper_submissions
    WHERE paper_submissions.submission_id IS NOT NULL AND paper_submissions.submission_id ~ '^IEC[0-9]+$';
    
    -- Format as IEC001, IEC002, etc.
    new_submission_id := 'IEC' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN new_submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
