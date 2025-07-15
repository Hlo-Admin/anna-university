import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, User, LogOut, Plus, FileText, Eye, Edit, UserX } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { DocumentViewer } from "@/components/DocumentViewer";
import { CreateReviewerDialog } from "@/components/CreateReviewerDialog";
import { SubmissionDetailsDialog } from "@/components/SubmissionDetailsDialog";
import { StatusUpdateDialog } from "@/components/StatusUpdateDialog";
import { AssignReviewerDialog } from "@/components/AssignReviewerDialog";
import { SubmissionTypeFilter } from "@/components/SubmissionTypeFilter";
import { SubmissionSearchFilter } from "@/components/SubmissionSearchFilter";
import { ReviewerStatusUpdate } from "@/components/ReviewerStatusUpdate";
import { supabase } from "@/integrations/supabase/client";
import { FormSubmission } from "@/types/submission";

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
  const [filteredSubmissions, setFilteredSubmissions] = useState<FormSubmission[]>([]);
  const [reviewers, setReviewers] = useState<ReviewerUser[]>([]);
  const [activeView, setActiveView] = useState("dashboard");
  const [submissionTypeFilter, setSubmissionTypeFilter] = useState("all");
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
  const [reviewerStatusUpdate, setReviewerStatusUpdate] = useState<{
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

  // Initialize filtered submissions when submissions change
  useEffect(() => {
    setFilteredSubmissions(submissions);
  }, [submissions]);

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
            submission.author_name,
            submission.submission_id
          );
          
          await sendEmail({
            to: reviewer.email,
            subject: `New Paper Assignment: ${submission.submission_id} - ${submission.paper_title}`,
            html: emailHtml
          });
          
          toast({
            title: "Assignment Updated",
            description: `Submission ${submission.submission_id} has been assigned to reviewer and email notification sent`,
          });
        } catch (emailError: any) {
          console.error("Email sending failed:", emailError);
          toast({
            title: "Assignment Updated",
            description: `Submission ${submission.submission_id} has been assigned to reviewer, but email notification failed`,
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

  const handleStatusUpdateRequest = (submissionId: string, newStatus: string) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (submission) {
      // Check if the status change is for selected/rejected (needs remarks)
      if (newStatus === 'selected' || newStatus === 'rejected') {
        setReviewerStatusUpdate({
          isOpen: true,
          submissionId,
          currentStatus: submission.status,
          newStatus,
          paperTitle: submission.paper_title
        });
      } else {
        setStatusUpdate({
          isOpen: true,
          submissionId,
          currentStatus: submission.status,
          newStatus,
          paperTitle: submission.paper_title
        });
      }
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

      // Get submission details for email
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
              statusUpdate.newStatus,
              submission.submission_id
            );
            
            await sendEmail({
              to: reviewer.email,
              subject: `Status Update: ${submission.submission_id} - ${submission.paper_title}`,
              html: emailHtml
            });
          } catch (emailError: any) {
            console.error("Email to reviewer failed:", emailError);
          }
        }
      }

      toast({
        title: "Status Updated",
        description: `Submission ${submission?.submission_id} status changed to ${statusUpdate.newStatus}`,
      });

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

  const confirmReviewerStatusUpdate = async (remarks: string) => {
    try {
      const { error } = await supabase
        .from('paper_submissions')
        .update({ 
          status: reviewerStatusUpdate.newStatus,
          remarks: remarks,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewerStatusUpdate.submissionId);

      if (error) throw error;

      // Get submission details for email
      const submission = submissions.find(s => s.id === reviewerStatusUpdate.submissionId);
      
      // Send status update email to reviewer
      if (submission && submission.assigned_to) {
        const reviewer = reviewers.find(r => r.id === submission.assigned_to);
        if (reviewer) {
          try {
            const { sendEmail, createStatusUpdateEmail } = await import("@/utils/emailService");
            const emailHtml = createStatusUpdateEmail(
              reviewer.name,
              submission.paper_title,
              reviewerStatusUpdate.newStatus,
              submission.submission_id
            );
            
            await sendEmail({
              to: reviewer.email,
              subject: `Status Update: ${submission.submission_id} - ${submission.paper_title}`,
              html: emailHtml
            });
          } catch (emailError: any) {
            console.error("Email to reviewer failed:", emailError);
          }
        }
      }

      // Send email to student for selected/rejected status
      if (submission) {
        try {
          const { sendEmail, createStudentStatusUpdateEmail } = await import("@/utils/emailService");
          const emailHtml = createStudentStatusUpdateEmail(
            submission.author_name,
            submission.paper_title,
            reviewerStatusUpdate.newStatus,
            submission.submission_id,
            remarks
          );
          
          await sendEmail({
            to: submission.email,
            subject: `Paper Review Update: ${submission.submission_id} - ${submission.paper_title}`,
            html: emailHtml
          });

          toast({
            title: "Status Updated",
            description: `Submission ${submission.submission_id} status changed to ${reviewerStatusUpdate.newStatus} and email notifications sent to both reviewer and student`,
          });
        } catch (emailError: any) {
          console.error("Email to student failed:", emailError);
          toast({
            title: "Status Updated",
            description: `Submission ${submission.submission_id} status changed to ${reviewerStatusUpdate.newStatus} and email notification sent to reviewer only`,
          });
        }
      }

      loadData(); // Refresh data
      setReviewerStatusUpdate({ ...reviewerStatusUpdate, isOpen: false });
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
    let filtered = filteredSubmissions;
    
    // Filter by submission type
    if (submissionTypeFilter !== "all") {
      filtered = filtered.filter(s => s.submission_type === submissionTypeFilter);
    }
    
    // Filter by view
    switch (activeView) {
      case "unassigned":
        return filtered.filter(s => s.assigned_to === null || s.status === "pending");
      case "assigned":
        return filtered.filter(s => s.status === "assigned");
      case "selected":
        return filtered.filter(s => s.status === "selected");
      case "rejected":
        return filtered.filter(s => s.status === "rejected");
      case "all-data":
      default:
        return filtered;
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        const extendedAbstractCount = submissions.filter(s => s.submission_type === "extended-abstract").length;
        const fullPaperCount = submissions.filter(s => s.submission_type === "fullpaper").length;
        const pendingCount = submissions.filter(s => s.status === "pending").length;
        const assignedCount = submissions.filter(s => s.status === "assigned").length;
        const selectedCount = submissions.filter(s => s.status === "selected").length;
        const rejectedCount = submissions.filter(s => s.status === "rejected").length;
        
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{submissions.length}</div>
                  <p className="text-xs text-muted-foreground">All paper submissions</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Reviewers</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reviewers.filter(r => r.is_active !== false).length}</div>
                  <p className="text-xs text-muted-foreground">Available for assignments</p>
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

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <FileText className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingCount}</div>
                  <p className="text-xs text-muted-foreground">Awaiting assignment</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Under Review</CardTitle>
                  <FileText className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assignedCount}</div>
                  <p className="text-xs text-muted-foreground">Currently being reviewed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Selected</CardTitle>
                  <FileText className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedCount}</div>
                  <p className="text-xs text-muted-foreground">Approved for conference</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                  <FileText className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{rejectedCount}</div>
                  <p className="text-xs text-muted-foreground">Not selected</p>
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
          <div className="space-y-6">
            <SubmissionSearchFilter
              submissions={submissions}
              onFilteredResults={setFilteredSubmissions}
              className="mb-6"
            />
            
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      {activeView === "all-data" ? "All Paper Submissions" :
                       activeView === "unassigned" ? "Unassigned Submissions" :
                       activeView === "assigned" ? "Assigned Submissions" :
                       activeView === "selected" ? "Selected Submissions" :
                       activeView === "rejected" ? "Rejected Submissions" : "Paper Submissions"}
                    </CardTitle>
                    <CardDescription>Review and manage paper submissions</CardDescription>
                  </div>
                  <SubmissionTypeFilter
                    value={submissionTypeFilter}
                    onChange={setSubmissionTypeFilter}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getFilteredSubmissions().map((submission) => (
                    <div key={submission.id} className="border rounded-lg p-6">
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
                          <h4 className="font-medium text-gray-900 mb-2">Admin Remarks:</h4>
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
                      No submissions found for this view and filter combination.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <AdminSidebar activeView={activeView} onViewChange={setActiveView} />
      
      <div className="lg:ml-64">
        <div className="container mx-auto px-4 py-8">
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

      <ReviewerStatusUpdate
        isOpen={reviewerStatusUpdate.isOpen}
        onClose={() => setReviewerStatusUpdate({ ...reviewerStatusUpdate, isOpen: false })}
        onConfirm={confirmReviewerStatusUpdate}
        currentStatus={reviewerStatusUpdate.currentStatus}
        newStatus={reviewerStatusUpdate.newStatus}
        paperTitle={reviewerStatusUpdate.paperTitle}
        submissionId={submissions.find(s => s.id === reviewerStatusUpdate.submissionId)?.submission_id || ""}
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
