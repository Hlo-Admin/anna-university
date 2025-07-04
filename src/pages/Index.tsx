
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Index = () => {
  const [formData, setFormData] = useState({
    submissionType: "",
    authorName: "",
    coAuthorName: "",
    email: "",
    phoneNumber: "",
    whatsappNumber: "",
    paperTitle: "",
    institution: "",
    designation: "",
    department: "",
    presentationMode: "",
    journalPublication: "",
    message: "",
    file: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const existingSubmissions = JSON.parse(localStorage.getItem("formSubmissions") || "[]");
      const newSubmission = {
        id: Date.now().toString(),
        ...formData,
        fileName: formData.file?.name || null,
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

      setFormData({
        submissionType: "",
        authorName: "",
        coAuthorName: "",
        email: "",
        phoneNumber: "",
        whatsappNumber: "",
        paperTitle: "",
        institution: "",
        designation: "",
        department: "",
        presentationMode: "",
        journalPublication: "",
        message: "",
        file: null
      });
      setShowForm(false);
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
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">MyApp</h1>
            </div>
            <div>
              <a 
                href="/login" 
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Admin Access
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        {!showForm ? (
          // Instructions Section
          <div className="max-w-4xl mx-auto text-center">
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
              onClick={() => setShowForm(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Apply Now
              <ChevronDown className="ml-2 h-5 w-5 animate-pulse" />
            </Button>
          </div>
        ) : (
          // Application Form
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Button 
                onClick={() => setShowForm(false)}
                variant="outline"
                className="mb-4"
              >
                ← Back to Instructions
              </Button>
            </div>
            
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl">Application Form</CardTitle>
                <CardDescription className="text-blue-100">
                  Please provide your information below
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Submission Type */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Submission Type *
                    </Label>
                    <RadioGroup
                      value={formData.submissionType}
                      onValueChange={(value) => handleSelectChange("submissionType", value)}
                      className="mt-2"
                      required
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="abstract" id="abstract" />
                        <Label htmlFor="abstract">Abstract Submission</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fullpaper" id="fullpaper" />
                        <Label htmlFor="fullpaper">Full Paper Submission</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Author Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="authorName" className="text-sm font-medium text-gray-700">
                        Author Name *
                      </Label>
                      <Input
                        id="authorName"
                        name="authorName"
                        type="text"
                        required
                        value={formData.authorName}
                        onChange={handleInputChange}
                        className="mt-1"
                        placeholder="Enter author name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="coAuthorName" className="text-sm font-medium text-gray-700">
                        Co-Author Name *
                      </Label>
                      <Input
                        id="coAuthorName"
                        name="coAuthorName"
                        type="text"
                        required
                        value={formData.coAuthorName}
                        onChange={handleInputChange}
                        className="mt-1"
                        placeholder="Enter co-author name"
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-1"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                        Phone Number (Country Code/Number)
                      </Label>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="mt-1"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="whatsappNumber" className="text-sm font-medium text-gray-700">
                      WhatsApp/Viber Number (Country Code/Number)
                    </Label>
                    <Input
                      id="whatsappNumber"
                      name="whatsappNumber"
                      type="tel"
                      value={formData.whatsappNumber}
                      onChange={handleInputChange}
                      className="mt-1"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  {/* Paper Details */}
                  <div>
                    <Label htmlFor="paperTitle" className="text-sm font-medium text-gray-700">
                      Paper Title *
                    </Label>
                    <Input
                      id="paperTitle"
                      name="paperTitle"
                      type="text"
                      required
                      value={formData.paperTitle}
                      onChange={handleInputChange}
                      className="mt-1"
                      placeholder="Enter your paper title"
                    />
                  </div>

                  {/* Institution Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="institution" className="text-sm font-medium text-gray-700">
                        College/University/Institution *
                      </Label>
                      <Input
                        id="institution"
                        name="institution"
                        type="text"
                        required
                        value={formData.institution}
                        onChange={handleInputChange}
                        className="mt-1"
                        placeholder="Enter institution name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="designation" className="text-sm font-medium text-gray-700">
                        Designation *
                      </Label>
                      <Input
                        id="designation"
                        name="designation"
                        type="text"
                        required
                        value={formData.designation}
                        onChange={handleInputChange}
                        className="mt-1"
                        placeholder="e.g., Professor, Student, Researcher"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                      Department *
                    </Label>
                    <Input
                      id="department"
                      name="department"
                      type="text"
                      required
                      value={formData.department}
                      onChange={handleInputChange}
                      className="mt-1"
                      placeholder="Enter department name"
                    />
                  </div>

                  {/* Presentation Mode */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Mode of Presentation *
                    </Label>
                    <RadioGroup
                      value={formData.presentationMode}
                      onValueChange={(value) => handleSelectChange("presentationMode", value)}
                      className="mt-2"
                      required
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="oral" id="oral" />
                        <Label htmlFor="oral">Oral Presentation</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="poster" id="poster" />
                        <Label htmlFor="poster">Poster Presentation</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="virtual" id="virtual" />
                        <Label htmlFor="virtual">Virtual Presentation (Online Live attending)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="video" id="video" />
                        <Label htmlFor="video">Video Presentation (Pre-recorded Video Presentation Option)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Journal Publication */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Journal Publication *
                    </Label>
                    <RadioGroup
                      value={formData.journalPublication}
                      onValueChange={(value) => handleSelectChange("journalPublication", value)}
                      className="mt-2"
                      required
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="journal-yes" />
                        <Label htmlFor="journal-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="journal-no" />
                        <Label htmlFor="journal-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Message */}
                  <div>
                    <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={4}
                      className="mt-1"
                      placeholder="Additional information or comments..."
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <Label htmlFor="file" className="text-sm font-medium text-gray-700">
                      File Upload
                    </Label>
                    <div className="mt-1 flex items-center space-x-2">
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileChange}
                        className="flex-1"
                        accept=".pdf,.doc,.docx,.txt"
                      />
                      <Upload className="h-5 w-5 text-gray-400" />
                    </div>
                    {formData.file && (
                      <p className="text-sm text-gray-600 mt-1">
                        Selected: {formData.file.name}
                      </p>
                    )}
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
        )}
      </div>
    </div>
  );
};

export default Index;
