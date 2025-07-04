
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogOut, FileText } from "lucide-react";

interface FormSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  submittedAt: string;
  status: string;
  assignedTo: string | null;
}

const ReviewerDashboard = () => {
  const [assignedSubmissions, setAssignedSubmissions] = useState<FormSubmission[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated and is reviewer
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user || user.role !== "reviewer") {
      navigate("/login");
      return;
    }

    setCurrentUser(user);
    loadAssignedSubmissions(user.id);
  }, [navigate]);

  const loadAssignedSubmissions = (reviewerId: string) => {
    const allSubmissions = JSON.parse(localStorage.getItem("formSubmissions") || "[]");
    const assigned = allSubmissions.filter((sub: FormSubmission) => sub.assignedTo === reviewerId);
    setAssignedSubmissions(assigned);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  const updateSubmissionStatus = (submissionId: string, newStatus: string) => {
    const allSubmissions = JSON.parse(localStorage.getItem("formSubmissions") || "[]");
    const updatedSubmissions = allSubmissions.map((sub: FormSubmission) => 
      sub.id === submissionId ? { ...sub, status: newStatus } : sub
    );
    
    localStorage.setItem("formSubmissions", JSON.stringify(updatedSubmissions));
    loadAssignedSubmissions(currentUser.id);
    
    toast({
      title: "Status Updated",
      description: `Application status changed to ${newStatus.replace("_", " ")}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "assigned": return "bg-blue-100 text-blue-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "needs_changes": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
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

        {/* Stats Card */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedSubmissions.length}</div>
            <p className="text-xs text-muted-foreground">
              Applications assigned to you for review
            </p>
          </CardContent>
        </Card>

        {/* Assigned Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Your Assigned Applications</CardTitle>
            <CardDescription>Review and update the status of assigned applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {assignedSubmissions.map((submission) => (
                <div key={submission.id} className="border rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{submission.name}</h3>
                      <p className="text-gray-600">{submission.email}</p>
                      {submission.phone && (
                        <p className="text-sm text-gray-500">{submission.phone}</p>
                      )}
                      {submission.company && (
                        <p className="text-sm text-gray-500">{submission.company}</p>
                      )}
                    </div>
                    <Badge className={getStatusColor(submission.status)}>
                      {submission.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Application Details:</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{submission.message}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
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
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="needs_changes">Needs Changes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              
              {assignedSubmissions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No applications assigned to you yet.</p>
                  <p className="text-sm">Check back later or contact your administrator.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReviewerDashboard;
