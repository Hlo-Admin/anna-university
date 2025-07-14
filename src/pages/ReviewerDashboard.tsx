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
import { ReviewerStatusUpdate } from "@/components/ReviewerStatusUpdate";
import { SubmissionTypeFilter } from "@/components/SubmissionTypeFilter";
import { SubmissionSearchFilter } from "@/components/SubmissionSearchFilter";
import { supabase } from "@/integrations/supabase/client";
import { SubmissionDetailsDialog } from "@/components/SubmissionDetailsDialog";
import { FormSubmission } from "@/types/submission";
import { sendEmail, createStudentStatusUpdateEmail, createStatusUpdateEmail } from "@/utils/emailService";

const ReviewerDashboard = () => {
  const [assignedSubmissions, setAssignedSubmissions] = useState<FormSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<FormSubmission[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [submissionTypeFilter, setSubmissionTypeFilter] = useState("all");
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

  useEffect(() => {
    setFilteredSubmissions(assignedSubmissions);
  }, [assignedSubmissions]);

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

  const confirmStatusUpdate = async (remarks: string) => {
    if (!statusUpdateDialog.submission) return;

    try {
      const { error } = await supabase
        .from('paper_submissions')
        .update({ 
          status: statusUpdateDialog.newStatus,
          remarks: remarks || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', statusUpdateDialog.submission.id);

      if (error) throw error;

      // Send email to student about status update
      try {
        await sendEmail({
          to: statusUpdateDialog.submission.email,
          subject: `Paper Submission Update - ${statusUpdateDialog.submission.submission_id}`,
          html: createStudentStatusUpdateEmail(
            statusUpdateDialog.submission.author_name,
            statusUpdateDialog.submission.paper_title,
            statusUpdateDialog.newStatus,
            statusUpdateDialog.submission.submission_id || '',
            remarks
          )
        });
        
        console.log('Student notification email sent successfully');
      } catch (emailError) {
        console.error('Failed to send student notification email:', emailError);
        // Don't block the status update if email fails
      }

      // Send email to admin/reviewer about status update
      try {
        await sendEmail({
          to: 'admin@conference.com', // You might want to make this configurable
          subject: `Status Update - ${statusUpdateDialog.submission.submission_id}`,
          html: createStatusUpdateEmail(
            currentUser.name || currentUser.username,
            statusUpdateDialog.submission.paper_title,
            statusUpdateDialog.newStatus,
            statusUpdateDialog.submission.submission_id || ''
          )
        });
        
        console.log('Admin notification email sent successfully');
      } catch (emailError) {
        console.error('Failed to send admin notification email:', emailError);
        // Don't block the status update if email fails
      }

      loadAssignedSubmissions(currentUser.id);
      toast({
        title: "Status Updated",
        description: `Submission ${statusUpdateDialog.submission.submission_id} status changed to ${statusUpdateDialog.newStatus}. Email notification sent to student.`,
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
    let filtered = filteredSubmissions;
    
    // Filter by submission type
    if (submissionTypeFilter !== "all") {
      filtered = filtered.filter(s => s.submission_type === submissionTypeFilter);
    }
    
    // Filter by view
    switch (activeView) {
      case "assigned":
        return filtered.filter(s => s.status === "assigned");
      case "selected":
        return filtered.filter(s => s.status === "selected");
      case "rejected":
        return filtered.filter(s => s.status === "rejected");
      default:
        return filtered;
    }
  };

  const renderSubmissionsList = (submissions: FormSubmission[], title: string) => {
    return (
      <div className="space-y-6">
        <SubmissionSearchFilter
          submissions={assignedSubmissions}
          onFilteredResults={setFilteredSubmissions}
          className="mb-6"
        />
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Review and update the status of paper submissions</CardDescription>
              </div>
              <SubmissionTypeFilter
                value={submissionTypeFilter}
                onChange={setSubmissionTypeFilter}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {submissions.map((submission) => (
                <div key={submission.id} className="border rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{submission.author_name}</h3>
                        <Badge variant="outline" className="font-mono text-xs">
                          {submission.submission_id}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{submission.email}</p>
                      <p className="text-sm text-gray-500">{submission.phone_country_code} {submission.phone_number}</p>
                      <p className="text-sm text-gray-500">Institution: {submission.institution}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-2 capitalize">
                        {submission.submission_type.replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Paper Title:</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{submission.paper_title}</p>
                  </div>

                  {submission.remarks && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Remarks:</h4>
                      <p className="text-gray-700 bg-blue-50 p-3 rounded border-l-4 border-blue-400">{submission.remarks}</p>
                    </div>
                  )}
                  
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
                  <p>No submissions found for this filter.</p>
                  <p className="text-sm">Try adjusting your filters or check back later.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderContent = () => {
    const filteredSubmissions = getFilteredSubmissions();

    switch (activeView) {
      case "dashboard":
        const extendedAbstractCount = assignedSubmissions.filter(s => s.submission_type === "extended-abstract").length;
        const fullPaperCount = assignedSubmissions.filter(s => s.submission_type === "fullpaper").length;
        
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assignedSubmissions.filter(s => s.status === "assigned").length}</div>
                <p className="text-xs text-muted-foreground">Awaiting decision</p>
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Extended Abstract</CardTitle>
                <FileText className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{extendedAbstractCount}</div>
                <p className="text-xs text-muted-foreground">Abstract submissions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Full Papers</CardTitle>
                <FileText className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fullPaperCount}</div>
                <p className="text-xs text-muted-foreground">Full paper submissions</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <ReviewerSidebar activeView={activeView} onViewChange={setActiveView} />
      
      <div className="lg:ml-64">
        <div className="container mx-auto px-4 py-8">
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

      <ReviewerStatusUpdate
        isOpen={statusUpdateDialog.isOpen}
        onClose={() => setStatusUpdateDialog({ ...statusUpdateDialog, isOpen: false })}
        onConfirm={confirmStatusUpdate}
        currentStatus={statusUpdateDialog.submission?.status || ""}
        newStatus={statusUpdateDialog.newStatus}
        paperTitle={statusUpdateDialog.submission?.paper_title || ""}
        submissionId={statusUpdateDialog.submission?.submission_id || ""}
      />
    </div>
  );
};

export default ReviewerDashboard;
