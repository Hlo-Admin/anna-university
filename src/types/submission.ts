
export interface FormSubmission {
  id: string;
  submission_id?: string; // Make optional to handle cases where it might not be set
  submission_type: string;
  author_name: string;
  co_author_name: string;
  email: string;
  phone_country_code: string;
  phone_number: string;
  whatsapp_country_code?: string;
  whatsapp_number?: string;
  paper_title: string;
  institution: string;
  designation: string;
  department: string;
  presentation_mode: string;
  journal_publication: string;
  message?: string;
  document_url?: string;
  document_name?: string;
  status: string;
  assigned_to: string | null;
  submitted_at: string;
  remarks?: string;
}
