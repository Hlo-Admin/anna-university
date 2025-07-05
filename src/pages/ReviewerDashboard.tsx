
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogOut, FileText, Download, Eye } from "lucide-react";
import { DocumentViewer } from "@/components/DocumentViewer";
import { supabase } from "@/integrations/supabase/client";

interface FormSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  company?: string;
  message: string;
  document_url?: string;
  document_name?: string;
  status: string;
  assigned_to: string | null;
  submitted_at: string;
}

const ReviewerDashboard = () => {
  const [assignedSubmissions, setAssignedSubmissions] = useState<FormSubmission[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [documentViewer, setDocumentViewer] = useState<{
    isOpen: boolean;
    documentUrl: string;
    documentName: string;
  }>({
    isOpen: false,
    documentUrl: "",
    documentName: ""
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

  const updateSubmissionStatus = async (submissionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('paper_submissions')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;

      loadAssignedSubmissions(currentUser.id);
      toast({
        title: "Status Updated",
        description: `Submission status changed to ${newStatus}`,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "assigned": return "bg-blue-100 text-blue-800";
      case "selected": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reviewer Dashboard</h1>
            <p className="text-gray-600">Welcome back, {currentUser.username}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedSubmissions.length}</div>
            <p className="text-xs text-muted-foreground">
              Paper submissions assigned to you for review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Assigned Submissions</CardTitle>
            <CardDescription>Review and update the status of assigned paper submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {assignedSubmissions.map((submission) => (
                <div key={submission.id} className="border rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{submission.name}</h3>
                      <p className="text-gray-600">{submission.email}</p>
                      <p className="text-sm text-gray-500">{submission.phone}</p>
                      {submission.whatsapp && (
                        <p className="text-sm text-gray-500">WhatsApp: {submission.whatsapp}</p>
                      )}
                      {submission.company && (
                        <p className="text-sm text-gray-500">Company: {submission.company}</p>
                      )}
                    </div>
                    <Badge className={getStatusColor(submission.status)}>
                      {submission.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Submission Details:</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{submission.message}</p>
                  </div>

                  {submission.document_url && submission.document_name && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700 flex-1">{submission.document_name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDocumentViewer(submission.document_url!, submission.document_name!)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = submission.document_url!;
                          link.download = submission.document_name!;
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Update Status:</span>
                      <Select
                        value={submission.status}
                        onValueChange={(value) => updateSubmissionStatus(submission.id, value)}
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
              
              {assignedSubmissions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No submissions assigned to you yet.</p>
                  <p className="text-sm">Check back later or contact your administrator.</p>
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
    </div>
  );
};

export default ReviewerDashboard;
