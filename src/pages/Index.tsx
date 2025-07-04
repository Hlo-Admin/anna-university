
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown } from "lucide-react";

const Index = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const scrollToForm = () => {
    document.getElementById("application-form")?.scrollIntoView({ 
      behavior: "smooth" 
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission - in real app, this would connect to your database
    try {
      // Store in localStorage for demo purposes
      const existingSubmissions = JSON.parse(localStorage.getItem("formSubmissions") || "[]");
      const newSubmission = {
        id: Date.now().toString(),
        ...formData,
        submittedAt: new Date().toISOString(),
        status: "pending",
        assignedTo: null
      };
      
      existingSubmissions.push(newSubmission);
      localStorage.setItem("formSubmissions", JSON.stringify(existingSubmissions));

      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you soon.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        message: ""
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Join Our Program
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Submit your application to be considered for our exclusive program. 
            Our team will review your submission and contact you with next steps.
          </p>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8 text-left rounded-r-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Application Instructions:</h3>
            <ul className="text-blue-800 space-y-1">
              <li>• Fill out all required fields completely</li>
              <li>• Provide accurate contact information</li>
              <li>• Include detailed information in the message field</li>
              <li>• Review your submission before clicking submit</li>
            </ul>
          </div>

          <Button 
            onClick={scrollToForm}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Start Application
            <ChevronDown className="ml-2 h-5 w-5 animate-pulse" />
          </Button>
        </div>

        {/* Application Form */}
        <div id="application-form" className="max-w-2xl mx-auto">
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl">Application Form</CardTitle>
              <CardDescription className="text-blue-100">
                Please provide your information below
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                      Company/Organization
                    </Label>
                    <Input
                      id="company"
                      name="company"
                      type="text"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Your company name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                    Additional Information *
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Tell us about yourself, your goals, and why you're interested in this program..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Admin Access */}
        <div className="text-center mt-12">
          <a 
            href="/login" 
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            Admin Access
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
