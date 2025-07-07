import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, User, LogOut, Plus, FileText, Download, Eye, Edit, UserX } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { DocumentViewer } from "@/components/DocumentViewer";
import { CreateReviewerDialog } from "@/components/CreateReviewerDialog";
import { SubmissionDetailsDialog } from "@/components/SubmissionDetailsDialog";
import { StatusUpdateDialog } from "@/components/StatusUpdateDialog";
import { AssignReviewerDialog } from "@/components/AssignReviewerDialog";
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
  password: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [reviewers, setReviewers] = useState<ReviewerUser[]>([]);
  const [activeView, setActiveView] = useState("dashboard");
  const [showCreateReviewer, setShowCreateReviewer] = useState(false);
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
  const [statusUpdate, setStatusUpdate] = useState<{
    isOpen: boolean;
    submissionId: string;
    currentStatus: string;
    newStatus: string;
    paperTitle: string;
  }>({
    isOpen: false,
    submissionId: "",
    currentStatus: "",
    newStatus: "",
    paperTitle: ""
  });
  const [assignReviewerDialog, setAssignReviewerDialog] = useState<{
    isOpen: boolean;
    submissionId: string;
    reviewerId: string;
    paperTitle: string;
    reviewerName: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    submissionId: "",
    reviewerId: "",
    paperTitle: "",
    reviewerName: "",
    isLoading: false
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser || currentUser.role !== "super_admin") {
      navigate("/login");
      return;
    }

    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      // Load submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('paper_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Load reviewers with is_active field
      const { data: reviewersData, error: reviewersError } = await supabase
        .from('reviewers')
        .select('*')
        .order('created_at', { ascending: false });

      if (reviewersError) throw reviewersError;

      setSubmissions(submissionsData || []);
      setReviewers(reviewersData || []);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  const handleAssignReviewerRequest = (submissionId: string, reviewerId: string) => {
    const submission = submissions.find(s => s.id === submissionId);
    const reviewer = reviewers.find(r => r.id === reviewerId);
    
    if (submission && reviewer) {
      setAssignReviewerDialog({
        isOpen: true,
        submissionId,
        reviewerId,
        paperTitle: submission.paper_title,
        reviewerName: reviewer.name,
        isLoading: false
      });
    }
  };

  const confirmAssignReviewer = async () => {
    setAssignReviewerDialog(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { error } = await supabase
        .from('paper_submissions')
        .update({ 
          assigned_to: assignReviewerDialog.reviewerId, 
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', assignReviewerDialog.submissionId);

      if (error) throw error;

      // Send assignment email
      const submission = submissions.find(s => s.id === assignReviewerDialog.submissionId);
      const reviewer = reviewers.find(r => r.id === assignReviewerDialog.reviewerId);
      
      if (submission && reviewer) {
        try {
          const { sendEmail, createAssignmentEmail } = await import("@/utils/emailService");
          const emailHtml = createAssignmentEmail(
            reviewer.name,
            submission.paper_title,
            submission.author_name
          );
          
          await sendEmail({
            to: reviewer.email,
            subject: `New Paper Assignment: ${submission.paper_title}`,
            html: emailHtml
          });
          
          toast({
            title: "Assignment Updated",
            description: "Form has been assigned to reviewer and email notification sent",
          });
        } catch (emailError: any) {
          console.error("Email sending failed:", emailError);
          toast({
            title: "Assignment Updated",
            description: "Form has been assigned to reviewer, but email notification failed",
            variant: "destructive"
          });
        }
      }

      loadData(); // Refresh data
      setAssignReviewerDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      setAssignReviewerDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const assignToReviewer = async (submissionId: string, reviewerId: string) => {
    try {
      const { error } = await supabase
        .from('paper_submissions')
        .update({ 
          assigned_to: reviewerId, 
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;

      // Send assignment email
      const submission = submissions.find(s => s.id === submissionId);
      const reviewer = reviewers.find(r => r.id === reviewerId);
      
      if (submission && reviewer) {
        try {
          const { sendEmail, createAssignmentEmail } = await import("@/utils/emailService");
          const emailHtml = createAssignmentEmail(
            reviewer.name,
            submission.paper_title,
            submission.author_name
          );
          
          await sendEmail({
            to: reviewer.email,
            subject: `New Paper Assignment: ${submission.paper_title}`,
            html: emailHtml
          });
          
          toast({
            title: "Assignment Updated",
            description: "Form has been assigned to reviewer and email notification sent",
          });
        } catch (emailError: any) {
          console.error("Email sending failed:", emailError);
          toast({
            title: "Assignment Updated",
            description: "Form has been assigned to reviewer, but email notification failed",
            variant: "destructive"
          });
        }
      }

      loadData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleStatusUpdateRequest = (submissionId: string, newStatus: string) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (submission) {
      setStatusUpdate({
        isOpen: true,
        submissionId,
        currentStatus: submission.status,
        newStatus,
        paperTitle: submission.paper_title
      });
    }
  };

  const confirmStatusUpdate = async () => {
    try {
      const { error } = await supabase
        .from('paper_submissions')
        .update({ 
          status: statusUpdate.newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', statusUpdate.submissionId);

      if (error) throw error;

      // Get submission details for student email
      const submission = submissions.find(s => s.id === statusUpdate.submissionId);
      
      // Send status update email to reviewer (existing logic)
      if (submission && submission.assigned_to) {
        const reviewer = reviewers.find(r => r.id === submission.assigned_to);
        if (reviewer) {
          try {
            const { sendEmail, createStatusUpdateEmail } = await import("@/utils/emailService");
            const emailHtml = createStatusUpdateEmail(
              reviewer.name,
              submission.paper_title,
              statusUpdate.newStatus
            );
            
            await sendEmail({
              to: reviewer.email,
              subject: `Status Update: ${submission.paper_title}`,
              html: emailHtml
            });
          } catch (emailError: any) {
            console.error("Email to reviewer failed:", emailError);
          }
        }
      }

      // Send email to student if status is selected or rejected
      if (submission && (statusUpdate.newStatus === 'selected' || statusUpdate.newStatus === 'rejected')) {
        try {
          const { sendEmail, createStudentStatusUpdateEmail } = await import("@/utils/emailService");
          const emailHtml = createStudentStatusUpdateEmail(
            submission.author_name,
            submission.paper_title,
            statusUpdate.newStatus
          );
          
          await sendEmail({
            to: submission.email,
            subject: `Paper Review Update: ${submission.paper_title}`,
            html: emailHtml
          });

          toast({
            title: "Status Updated",
            description: `Submission status changed to ${statusUpdate.newStatus} and email notifications sent to both reviewer and student`,
          });
        } catch (emailError: any) {
          console.error("Email to student failed:", emailError);
          toast({
            title: "Status Updated",
            description: `Submission status changed to ${statusUpdate.newStatus} and email notification sent to reviewer`,
          });
        }
      } else {
        toast({
          title: "Status Updated",
          description: `Submission status changed to ${statusUpdate.newStatus} and email notification sent to reviewer`,
        });
      }

      loadData(); // Refresh data
      setStatusUpdate({ ...statusUpdate, isOpen: false });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleReviewerStatus = async (reviewerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('reviewers')
        .update({ is_active: !currentStatus })
        .eq('id', reviewerId);

      if (error) throw error;

      loadData(); // Refresh data
      toast({
        title: "Reviewer Status Updated",
        description: `Reviewer has been ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
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
      case "unassigned":
        return submissions.filter(s => s.assigned_to === null || s.status === "pending");
      case "assigned":
        return submissions.filter(s => s.status === "assigned");
      case "selected":
        return submissions.filter(s => s.status === "selected");
      case "rejected":
        return submissions.filter(s => s.status === "rejected");
      case "all-data":
      default:
        return submissions;
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{submissions.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Reviewers</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reviewers.filter(r => r.is_active !== false).length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {submissions.filter(s => s.status === "pending").length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Selected</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {submissions.filter(s => s.status === "selected").length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "reviewers":
        return (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Reviewer Accounts</CardTitle>
                  <CardDescription>Manage reviewer access and credentials</CardDescription>
                </div>
                <Button 
                  onClick={() => setShowCreateReviewer(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Reviewer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviewers.map((reviewer) => (
                  <div key={reviewer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <button
                        onClick={() => navigate(`/admin/reviewer/${reviewer.id}/submissions`)}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                      >
                        {reviewer.name}
                      </button>
                      <p className="text-sm text-gray-500">{reviewer.email}</p>
                      <p className="text-sm text-gray-500">{reviewer.phone}</p>
                      <p className="text-xs text-gray-400">
                        Username: {reviewer.username} | Created: {new Date(reviewer.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-blue-600">
                        {submissions.filter(s => s.assigned_to === reviewer.id).length} submissions assigned
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={reviewer.is_active !== false ? "default" : "secondary"}>
                        {reviewer.is_active !== false ? "Active" : "Inactive"}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {/* TODO: Add edit functionality */}}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleReviewerStatus(reviewer.id, reviewer.is_active !== false)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {reviewers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No reviewers found. Create your first reviewer account.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>
                {activeView === "all-data" ? "All Paper Submissions" :
                 activeView === "unassigned" ? "Unassigned Submissions" :
                 activeView === "assigned" ? "Assigned Submissions" :
                 activeView === "selected" ? "Selected Submissions" :
                 activeView === "rejected" ? "Rejected Submissions" : "Paper Submissions"}
              </CardTitle>
              <CardDescription>Review and manage paper submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredSubmissions().map((submission) => (
                  <div key={submission.id} className="border rounded-lg p-6">
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
                        <Select
                          value={submission.status}
                          onValueChange={(value) => handleStatusUpdateRequest(submission.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="selected">Selected</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select
                          value={submission.assigned_to || ""}
                          onValueChange={(value) => handleAssignReviewerRequest(submission.id, value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Assign to reviewer" />
                          </SelectTrigger>
                          <SelectContent>
                            {reviewers.filter(r => r.is_active !== false).map((reviewer) => (
                              <SelectItem key={reviewer.id} value={reviewer.id}>
                                {reviewer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
                
                {getFilteredSubmissions().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No submissions found for this view.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex">
      <AdminSidebar activeView={activeView} onViewChange={setActiveView} />
      
      <div className="flex-1 lg:ml-0">
        <div className="container mx-auto px-4 py-8 lg:pl-8">
          <div className="flex justify-between items-center mb-8 lg:ml-0 ml-16">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-gray-600">Manage paper submissions and reviewer accounts</p>
            </div>
            <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {renderContent()}
        </div>
      </div>

      <CreateReviewerDialog
        isOpen={showCreateReviewer}
        onClose={() => setShowCreateReviewer(false)}
        onReviewerCreated={loadData}
      />

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
        isOpen={statusUpdate.isOpen}
        onClose={() => setStatusUpdate({ ...statusUpdate, isOpen: false })}
        onConfirm={confirmStatusUpdate}
        currentStatus={statusUpdate.currentStatus}
        newStatus={statusUpdate.newStatus}
        paperTitle={statusUpdate.paperTitle}
      />

      <AssignReviewerDialog
        isOpen={assignReviewerDialog.isOpen}
        onClose={() => setAssignReviewerDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmAssignReviewer}
        paperTitle={assignReviewerDialog.paperTitle}
        reviewerName={assignReviewerDialog.reviewerName}
        isLoading={assignReviewerDialog.isLoading}
      />
    </div>
  );
};

export default AdminDashboard;
