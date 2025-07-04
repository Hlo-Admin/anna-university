
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, User, LogOut, Plus } from "lucide-react";

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

interface ReviewerUser {
  id: string;
  username: string;
  password: string;
  role: string;
  createdAt: string;
}

const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [reviewers, setReviewers] = useState<ReviewerUser[]>([]);
  const [showCreateReviewer, setShowCreateReviewer] = useState(false);
  const [newReviewer, setNewReviewer] = useState({
    username: "",
    password: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated and is super admin
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser || currentUser.role !== "super_admin") {
      navigate("/login");
      return;
    }

    loadData();
  }, [navigate]);

  const loadData = () => {
    const formSubmissions = JSON.parse(localStorage.getItem("formSubmissions") || "[]");
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    
    setSubmissions(formSubmissions);
    setReviewers(users.filter((u: ReviewerUser) => u.role === "reviewer"));
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  const createReviewer = (e: React.FormEvent) => {
    e.preventDefault();
    
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const newUser: ReviewerUser = {
      id: `reviewer-${Date.now()}`,
      username: newReviewer.username,
      password: newReviewer.password,
      role: "reviewer",
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    
    setNewReviewer({ username: "", password: "" });
    setShowCreateReviewer(false);
    loadData();
    
    toast({
      title: "Reviewer Created",
      description: `Account created for ${newReviewer.username}`,
    });
  };

  const assignToReviewer = (submissionId: string, reviewerId: string) => {
    const updatedSubmissions = submissions.map(sub => 
      sub.id === submissionId 
        ? { ...sub, assignedTo: reviewerId, status: "assigned" }
        : sub
    );
    
    setSubmissions(updatedSubmissions);
    localStorage.setItem("formSubmissions", JSON.stringify(updatedSubmissions));
    
    toast({
      title: "Assignment Updated",
      description: "Form has been assigned to reviewer",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-600">Manage applications and reviewer accounts</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <div className="text-2xl font-bold">{reviewers.length}</div>
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
        </div>

        {/* Reviewer Management */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Reviewer Accounts</CardTitle>
                <CardDescription>Manage reviewer access and credentials</CardDescription>
              </div>
              <Button 
                onClick={() => setShowCreateReviewer(!showCreateReviewer)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Reviewer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showCreateReviewer && (
              <form onSubmit={createReviewer} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reviewer-username">Username</Label>
                    <Input
                      id="reviewer-username"
                      value={newReviewer.username}
                      onChange={(e) => setNewReviewer(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reviewer-password">Password</Label>
                    <Input
                      id="reviewer-password"
                      type="password"
                      value={newReviewer.password}
                      onChange={(e) => setNewReviewer(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button type="submit">Create Account</Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateReviewer(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {reviewers.map((reviewer) => (
                <div key={reviewer.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{reviewer.username}</p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(reviewer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">Reviewer</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Form Submissions</CardTitle>
            <CardDescription>Review and assign applications to reviewers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="border rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{submission.name}</h3>
                      <p className="text-gray-600">{submission.email}</p>
                      {submission.company && (
                        <p className="text-sm text-gray-500">{submission.company}</p>
                      )}
                    </div>
                    <Badge className={getStatusColor(submission.status)}>
                      {submission.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{submission.message}</p>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Select
                        value={submission.assignedTo || ""}
                        onValueChange={(value) => assignToReviewer(submission.id, value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Assign to reviewer" />
                        </SelectTrigger>
                        <SelectContent>
                          {reviewers.map((reviewer) => (
                            <SelectItem key={reviewer.id} value={reviewer.id}>
                              {reviewer.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              
              {submissions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No form submissions yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
