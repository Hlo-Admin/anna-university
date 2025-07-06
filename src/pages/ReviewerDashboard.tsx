
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogOut, FileText, Eye } from "lucide-react";
import { DocumentViewer } from "@/components/DocumentViewer";
import { ReviewerSidebar } from "@/components/ReviewerSidebar";
import { StatusUpdateDialog } from "@/components/StatusUpdateDialog";
import { supabase } from "@/integrations/supabase/client";
import { SubmissionDetailsDialog } from "@/components/SubmissionDetailsDialog";

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

const ReviewerDashboard = () => {
  const [assignedSubmissions, setAssignedSubmissions] = useState<FormSubmission[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeView, setActiveView] = useState("dashboard");
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
  const [statusUpdateDialog, setStatusUpdateDialog] = useState<{
    isOpen: boolean;
    submission: FormSubmission | null;
    newStatus: string;
  }>({
    isOpen: false,
    submission: null,
    newStatus: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user || user.role !== "reviewer") {
      navigate("/login");
      return;
    }

    setCurrentUser(user);
    loadAssignedSubmissions(user.id);
  }, [navigate]);

  const loadAssignedSubmissions = async (reviewerId: string) => {
    try {
      const { data, error } = await supabase
        .from('paper_submissions')
        .select('*')
        .eq('assigned_to', reviewerId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setAssignedSubmissions(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading submissions",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  const handleStatusChange = (submission: FormSubmission, newStatus: string) => {
    setStatusUpdateDialog({
      isOpen: true,
      submission,
      newStatus
    });
  };

  const confirmStatusUpdate = async () => {
    if (!statusUpdateDialog.submission) return;

    try {
      const { error } = await supabase
        .from('paper_submissions')
        .update({ 
          status: statusUpdateDialog.newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', statusUpdateDialog.submission.id);

      if (error) throw error;

      loadAssignedSubmissions(currentUser.id);
      toast({
        title: "Status Updated",
        description: `Submission status changed to ${statusUpdateDialog.newStatus}`,
      });
      
      setStatusUpdateDialog({ isOpen: false, submission: null, newStatus: "" });
    } catch (error: any) {
      toast({
        title: "Error",
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

  const getFilteredSubmissions = () => {
    switch (activeView) {
      case "assigned":
        return assignedSubmissions.filter(s => s.status === "assigned");
      case "selected":
        return assignedSubmissions.filter(s => s.status === "selected");
      case "rejected":
        return assignedSubmissions.filter(s => s.status === "rejected");
      default:
        return assignedSubmissions;
    }
  };

  const renderSubmissionsList = (submissions: FormSubmission[], title: string) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Review and update the status of paper submissions</CardDescription>
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
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Paper Title:</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{submission.paper_title}</p>
                </div>
                
                <div className="flex justify-between items-center">
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
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Update Status:</span>
                    <Select
                      value={submission.status}
                      onValueChange={(value) => handleStatusChange(submission, value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="selected">Selected</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
            
            {submissions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No submissions found for this status.</p>
                <p className="text-sm">Check back later or contact your administrator.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderContent = () => {
    const filteredSubmissions = getFilteredSubmissions();

    switch (activeView) {
      case "dashboard":
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assignedSubmissions.length}</div>
                <p className="text-xs text-muted-foreground">All assigned papers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned</CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assignedSubmissions.filter(s => s.status === "assigned").length}</div>
                <p className="text-xs text-muted-foreground">Pending review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Selected</CardTitle>
                <FileText className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assignedSubmissions.filter(s => s.status === "selected").length}</div>
                <p className="text-xs text-muted-foreground">Approved papers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <FileText className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assignedSubmissions.filter(s => s.status === "rejected").length}</div>
                <p className="text-xs text-muted-foreground">Declined papers</p>
              </CardContent>
            </Card>
          </div>
        );

      case "assigned":
        return renderSubmissionsList(filteredSubmissions, "Assigned Submissions");

      case "selected":
        return renderSubmissionsList(filteredSubmissions, "Selected Submissions");

      case "rejected":
        return renderSubmissionsList(filteredSubmissions, "Rejected Submissions");

      default:
        return null;
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex">
      <ReviewerSidebar activeView={activeView} onViewChange={setActiveView} />
      
      <div className="flex-1 lg:ml-0">
        <div className="container mx-auto px-4 py-8 lg:pl-8">
          <div className="flex justify-between items-center mb-8 lg:ml-0 ml-16">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reviewer Dashboard</h1>
              <p className="text-gray-600">Welcome back, {currentUser.username}</p>
            </div>
            <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {renderContent()}
        </div>
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

      <StatusUpdateDialog
        isOpen={statusUpdateDialog.isOpen}
        onClose={() => setStatusUpdateDialog({ ...statusUpdateDialog, isOpen: false })}
        onConfirm={confirmStatusUpdate}
        currentStatus={statusUpdateDialog.submission?.status || ""}
        newStatus={statusUpdateDialog.newStatus}
        paperTitle={statusUpdateDialog.submission?.paper_title || ""}
      />
    </div>
  );
};

export default ReviewerDashboard;
