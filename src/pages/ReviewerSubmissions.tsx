
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, Eye } from "lucide-react";
import { DocumentViewer } from "@/components/DocumentViewer";
import { SubmissionDetailsDialog } from "@/components/SubmissionDetailsDialog";
import { supabase } from "@/integrations/supabase/client";

interface FormSubmission {
  id: string;
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
}

interface ReviewerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
}

const ReviewerSubmissions = () => {
  const { reviewerId } = useParams<{ reviewerId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [reviewer, setReviewer] = useState<ReviewerUser | null>(null);
  const [documentViewer, setDocumentViewer] = useState<{
    isOpen: boolean;
    documentUrl: string;
    documentName: string;
  }>({
    isOpen: false,
    documentUrl: "",
    documentName: ""
  });
  const [submissionDetails, setSubmissionDetails] = useState<{
    isOpen: boolean;
    submission: FormSubmission | null;
  }>({
    isOpen: false,
    submission: null
  });

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser || currentUser.role !== "super_admin") {
      navigate("/login");
      return;
    }

    if (reviewerId) {
      loadReviewerData(reviewerId);
      loadSubmissions(reviewerId);
    }
  }, [reviewerId, navigate]);

  const loadReviewerData = async (reviewerId: string) => {
    try {
      const { data, error } = await supabase
        .from('reviewers')
        .select('*')
        .eq('id', reviewerId)
        .single();

      if (error) throw error;
      setReviewer(data);
    } catch (error: any) {
      toast({
        title: "Error loading reviewer data",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadSubmissions = async (reviewerId: string) => {
    try {
      const { data, error } = await supabase
        .from('paper_submissions')
        .select('*')
        .eq('assigned_to', reviewerId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading submissions",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const openDocumentViewer = (documentUrl: string, documentName: string) => {
    setDocumentViewer({
      isOpen: true,
      documentUrl,
      documentName
    });
  };

  const openSubmissionDetails = (submission: FormSubmission) => {
    setSubmissionDetails({
      isOpen: true,
      submission
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "assigned": return "bg-blue-100 text-blue-800";
      case "selected": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            onClick={() => navigate("/admin")} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Submissions for {reviewer?.name || 'Reviewer'}
            </h1>
            <p className="text-gray-600">
              {reviewer?.email} | {submissions.length} submissions
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Paper Submissions</CardTitle>
            <CardDescription>All submissions handled by this reviewer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {submissions.map((submission) => (
                <div key={submission.id} className="border rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{submission.author_name}</h3>
                      <p className="text-gray-600">{submission.email}</p>
                      <p className="text-sm text-gray-500">{submission.phone_country_code} {submission.phone_number}</p>
                      <p className="text-sm text-gray-500">Institution: {submission.institution}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-2">{submission.submission_type}</p>
                      <p className="text-xs text-gray-400">
                        Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Paper Title:</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{submission.paper_title}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSubmissionDetails(submission)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    {submission.document_url && submission.document_name && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDocumentViewer(submission.document_url!, submission.document_name!)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View Document
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {submissions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No submissions assigned to this reviewer yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <DocumentViewer
        isOpen={documentViewer.isOpen}
        onClose={() => setDocumentViewer({ ...documentViewer, isOpen: false })}
        documentUrl={documentViewer.documentUrl}
        documentName={documentViewer.documentName}
      />

      <SubmissionDetailsDialog
        isOpen={submissionDetails.isOpen}
        onClose={() => setSubmissionDetails({ ...submissionDetails, isOpen: false })}
        submission={submissionDetails.submission}
        onViewDocument={openDocumentViewer}
      />
    </div>
  );
};

export default ReviewerSubmissions;
