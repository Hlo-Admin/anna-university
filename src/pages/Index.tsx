
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PhoneInput from "@/components/PhoneInput";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [formData, setFormData] = useState({
    submissionType: "",
    authorName: "",
    coAuthorName: "",
    email: "",
    phoneNumber: "",
    phoneCountryCode: "+91",
    whatsappNumber: "",
    whatsappCountryCode: "+91",
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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
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

  const handleCountryCodeChange = (field: string, countryCode: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: countryCode
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
      let documentUrl = null;
      let documentName = null;

      // Upload file to Supabase storage if file exists
      if (formData.file) {
        const fileExt = formData.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, formData.file);

        if (uploadError) {
          throw new Error(`File upload failed: ${uploadError.message}`);
        }

        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);

        documentUrl = urlData.publicUrl;
        documentName = formData.file.name;
      }

      // Insert data into paper_submissions table with separate fields
      const { error: insertError } = await supabase
        .from('paper_submissions')
        .insert({
          submission_type: formData.submissionType,
          author_name: formData.authorName,
          co_author_name: formData.coAuthorName,
          email: formData.email,
          phone_country_code: formData.phoneCountryCode,
          phone_number: formData.phoneNumber,
          whatsapp_country_code: formData.whatsappNumber ? formData.whatsappCountryCode : null,
          whatsapp_number: formData.whatsappNumber || null,
          paper_title: formData.paperTitle,
          institution: formData.institution,
          designation: formData.designation,
          department: formData.department,
          presentation_mode: formData.presentationMode,
          journal_publication: formData.journalPublication,
          message: formData.message || null,
          document_url: documentUrl,
          document_name: documentName
        });

      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      // Show success dialog
      setShowSuccessDialog(true);

      // Reset form
      setFormData({
        submissionType: "",
        authorName: "",
        coAuthorName: "",
        email: "",
        phoneNumber: "",
        phoneCountryCode: "+91",
        whatsappNumber: "",
        whatsappCountryCode: "+91",
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

    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later.",
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
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/cc7dfcca-5750-4f88-9b73-4693e619e400.png" 
                alt="Anna University Logo" 
                className="h-10 w-10"
              />
              <h1 className="text-2xl font-bold text-gray-900">Anna University</h1>
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
              Submit Your Paper
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Share your research to be considered for publication in our upcoming issue. 
              Our editorial team will review your submission and get in touch with the next steps.
            </p>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8 text-left rounded-r-lg">
              <h3 className="font-semibold text-blue-900 mb-3">Submission Guidelines:</h3>
              <ul className="text-blue-800 space-y-2">
                <li>• Complete all required fields accurately</li>
                <li>• Ensure your contact details are up to date</li>
                <li>• Provide a detailed abstract or description in the message field</li>
                <li>• Review your paper and submission details before clicking "Submit"</li>
              </ul>
            </div>

            <Button 
              onClick={() => setShowForm(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Submit Paper
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
                    <Select
                      value={formData.submissionType}
                      onValueChange={(value) => handleSelectChange("submissionType", value)}
                      required
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select submission type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="abstract">Abstract Submission</SelectItem>
                        <SelectItem value="fullpaper">Full Paper Submission</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <PhoneInput
                        label="Phone Number"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        onCountryChange={(code) => handleCountryCodeChange("phoneCountryCode", code)}
                        selectedCountry={formData.phoneCountryCode}
                        placeholder="Enter phone number"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <PhoneInput
                      label="WhatsApp/Viber Number"
                      id="whatsappNumber"
                      name="whatsappNumber"
                      value={formData.whatsappNumber}
                      onChange={handleInputChange}
                      onCountryChange={(code) => handleCountryCodeChange("whatsappCountryCode", code)}
                      selectedCountry={formData.whatsappCountryCode}
                      placeholder="Enter WhatsApp/Viber number"
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
                    <Select
                      value={formData.presentationMode}
                      onValueChange={(value) => handleSelectChange("presentationMode", value)}
                      required
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select presentation mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oral">Oral Presentation</SelectItem>
                        <SelectItem value="poster">Poster Presentation</SelectItem>
                        <SelectItem value="virtual">Virtual Presentation (Online Live attending)</SelectItem>
                        <SelectItem value="video">Video Presentation (Pre-recorded Video Presentation Option)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Journal Publication */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Journal Publication *
                    </Label>
                    <Select
                      value={formData.journalPublication}
                      onValueChange={(value) => handleSelectChange("journalPublication", value)}
                      required
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select journal publication preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
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

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">
              🎉 Application Submitted Successfully!
            </DialogTitle>
            <DialogDescription className="text-center">
              Thank you for your submission! We have received your paper application 
              and will review it carefully. Our team will get back to you soon with 
              the next steps.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-4">
            <Button 
              onClick={() => setShowSuccessDialog(false)}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
