
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize default admin account if not exists
  const initializeDefaultAdmin = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.length === 0) {
      const defaultAdmin = {
        id: "admin-1",
        username: "admin",
        password: "admin123", // In real app, this would be hashed
        role: "super_admin",
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("users", JSON.stringify([defaultAdmin]));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    initializeDefaultAdmin();
    
    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const user = users.find((u: any) => 
        u.username === credentials.username && u.password === credentials.password
      );

      if (user) {
        // Store session
        localStorage.setItem("currentUser", JSON.stringify(user));
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${user.role === 'super_admin' ? 'Super Admin' : 'Reviewer'}!`,
        });

        // Redirect based on role
        if (user.role === "super_admin") {
          navigate("/admin");
        } else {
          navigate("/reviewer");
        }
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An error occurred during login",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg text-center">
          <LogIn className="h-12 w-12 mx-auto mb-2" />
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription className="text-blue-100">
            Enter your credentials to access the admin portal
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={credentials.username}
                onChange={handleInputChange}
                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter your username"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={credentials.password}
                onChange={handleInputChange}
                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Default login credentials:</p>
            <p className="text-sm font-mono">Username: admin</p>
            <p className="text-sm font-mono">Password: admin123</p>
          </div>

          <div className="text-center mt-6">
            <a href="/" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
              ← Back to Application Form
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
