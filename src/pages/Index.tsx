import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [formData, setFormData] = useState({
    submissionType: "",
    authorName: "",
    coAuthorName: "",
    email: "",
    phoneCountryCode: "+1",
    phoneNumber: "",
    whatsappCountryCode: "+1",
    whatsappNumber: "",
    paperTitle: "",
    institution: "",
    designation: "",
    department: "",
    presentationMode: "",
    journalPublication: "",
    message: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const countryCodes = [
    { code: "+1", label: "United States (+1)" },
    { code: "+44", label: "United Kingdom (+44)" },
    { code: "+91", label: "India (+91)" },
    { code: "+61", label: "Australia (+61)" },
    { code: "+49", label: "Germany (+49)" },
    { code: "+33", label: "France (+33)" },
    { code: "+81", label: "Japan (+81)" },
    { code: "+86", label: "China (+86)" },
    { code: "+55", label: "Brazil (+55)" },
    { code: "+7", label: "Russia (+7)" }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Please correct the errors below.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!selectedFile) {
        throw new Error("No file selected");
      }

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${formData.authorName.replace(/\s/g, '_')}_${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      const documentUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${filePath}`;

      const { error: submissionError } = await supabase
        .from('paper_submissions')
        .insert({
          submission_type: formData.submissionType,
          author_name: formData.authorName,
          co_author_name: formData.coAuthorName,
          email: formData.email,
          phone_country_code: formData.phoneCountryCode,
          phone_number: formData.phoneNumber,
          whatsapp_country_code: formData.whatsappCountryCode,
          whatsapp_number: formData.whatsappNumber,
          paper_title: formData.paperTitle,
          institution: formData.institution,
          designation: formData.designation,
          department: formData.department,
          presentation_mode: formData.presentationMode,
          journal_publication: formData.journalPublication,
          message: formData.message,
          document_url: documentUrl,
          document_name: selectedFile.name,
          status: 'pending',
          submitted_at: new Date().toISOString()
        });

      if (submissionError) {
        throw submissionError;
      }

      toast({
        title: "Success",
        description: "Form submitted successfully!",
      });

      navigate("/success");
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred during submission.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.submissionType) newErrors.submissionType = "Submission type is required";
    if (!formData.authorName.trim()) newErrors.authorName = "Author name is required";
    if (!formData.coAuthorName.trim()) newErrors.coAuthorName = "Co-author name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phoneCountryCode) newErrors.phoneCountryCode = "Country code is required";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
    if (!formData.paperTitle.trim()) newErrors.paperTitle = "Paper title is required";
    if (!formData.institution.trim()) newErrors.institution = "Institution is required";
    if (!formData.designation.trim()) newErrors.designation = "Designation is required";
    if (!formData.department.trim()) newErrors.department = "Department is required";
    if (!formData.presentationMode) newErrors.presentationMode = "Presentation mode is required";
    if (!formData.journalPublication) newErrors.journalPublication = "Journal publication preference is required";
    if (!selectedFile) newErrors.document = "Document upload is required";

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg text-center">
          <CardTitle className="text-3xl font-bold">Paper Submission Form</CardTitle>
          <CardDescription className="text-blue-100">
            Please fill out the form below to submit your paper
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Submission Type */}
            <div className="space-y-2">
              <Label htmlFor="submissionType" className="text-sm font-medium text-gray-700">
                Submission Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.submissionType}
                onValueChange={(value) => handleSelectChange("submissionType", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select submission type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="journal">Journal</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                </SelectContent>
              </Select>
              {errors.submissionType && <p className="text-red-500 text-sm">{errors.submissionType}</p>}
            </div>

            {/* Author Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="authorName" className="text-sm font-medium text-gray-700">
                  Author Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="authorName"
                  name="authorName"
                  type="text"
                  value={formData.authorName}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Enter author name"
                />
                {errors.authorName && <p className="text-red-500 text-sm">{errors.authorName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="coAuthorName" className="text-sm font-medium text-gray-700">
                  Co-Author Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="coAuthorName"
                  name="coAuthorName"
                  type="text"
                  value={formData.coAuthorName}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Enter co-author name"
                />
                {errors.coAuthorName && <p className="text-red-500 text-sm">{errors.coAuthorName}</p>}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Enter email"
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <div className="flex">
                  <Select
                    value={formData.phoneCountryCode}
                    onValueChange={(value) => handleSelectChange("phoneCountryCode", value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Phone number"
                    className="mt-1 ml-2"
                  />
                </div>
                {errors.phoneCountryCode && <p className="text-red-500 text-sm">{errors.phoneCountryCode}</p>}
                {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber}</p>}
              </div>
            </div>

            {/* WhatsApp Number (Optional) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">WhatsApp Number (Optional)</Label>
                <div className="flex">
                  <Select
                    value={formData.whatsappCountryCode}
                    onValueChange={(value) => handleSelectChange("whatsappCountryCode", value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    placeholder="WhatsApp number"
                    className="mt-1 ml-2"
                  />
                </div>
              </div>
            </div>

            {/* Paper Information */}
            <div className="space-y-2">
              <Label htmlFor="paperTitle" className="text-sm font-medium text-gray-700">
                Paper Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="paperTitle"
                name="paperTitle"
                type="text"
                value={formData.paperTitle}
                onChange={handleChange}
                className="mt-1"
                placeholder="Enter paper title"
              />
              {errors.paperTitle && <p className="text-red-500 text-sm">{errors.paperTitle}</p>}
            </div>

            {/* Institution Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="institution" className="text-sm font-medium text-gray-700">
                  Institution <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="institution"
                  name="institution"
                  type="text"
                  value={formData.institution}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Enter institution"
                />
                {errors.institution && <p className="text-red-500 text-sm">{errors.institution}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation" className="text-sm font-medium text-gray-700">
                  Designation <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="designation"
                  name="designation"
                  type="text"
                  value={formData.designation}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Enter designation"
                />
                {errors.designation && <p className="text-red-500 text-sm">{errors.designation}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Enter department"
                />
                {errors.department && <p className="text-red-500 text-sm">{errors.department}</p>}
              </div>
            </div>

            {/* Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="presentationMode" className="text-sm font-medium text-gray-700">
                  Preferred Presentation Mode <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.presentationMode}
                  onValueChange={(value) => handleSelectChange("presentationMode", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select presentation mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
                {errors.presentationMode && <p className="text-red-500 text-sm">{errors.presentationMode}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="journalPublication" className="text-sm font-medium text-gray-700">
                  Journal Publication Preference <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.journalPublication}
                  onValueChange={(value) => handleSelectChange("journalPublication", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select journal publication preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="maybe">Maybe</SelectItem>
                  </SelectContent>
                </Select>
                {errors.journalPublication && <p className="text-red-500 text-sm">{errors.journalPublication}</p>}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                Additional Message
              </Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="mt-1"
                placeholder="Enter additional message (optional)"
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="document" className="text-sm font-medium text-gray-700">
                Upload Document <span className="text-red-500">*</span>
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="document"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                />
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Click to upload
                    </button>
                    <p className="text-gray-500">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-400">PDF, DOC, DOCX up to 10MB</p>
                </div>
                
                {selectedFile && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-900">{selectedFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              {errors.document && <p className="text-red-500 text-sm">{errors.document}</p>}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
