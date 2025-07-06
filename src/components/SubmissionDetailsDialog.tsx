
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, X } from "lucide-react";

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

interface SubmissionDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  submission: FormSubmission | null;
  onViewDocument: (documentUrl: string, documentName: string) => void;
}

export const SubmissionDetailsDialog: React.FC<SubmissionDetailsDialogProps> = ({
  isOpen,
  onClose,
  submission,
  onViewDocument
}) => {
  if (!submission) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "assigned": return "bg-blue-100 text-blue-800";
      case "selected": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleDownload = () => {
    if (submission.document_url && submission.document_name) {
      const link = document.createElement('a');
      link.href = submission.document_url;
      link.download = submission.document_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-bold">Submission Details</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(submission.status)}>
                  {submission.status.toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-500">
                  {submission.submission_type.charAt(0).toUpperCase() + submission.submission_type.slice(1)} Submission
                </span>
              </div>
            </div>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Author Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Author Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Author Name</label>
                <p className="font-medium">{submission.author_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Co-Author Name</label>
                <p className="font-medium">{submission.co_author_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="font-medium">{submission.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Phone Number</label>
                <p className="font-medium">{submission.phone_country_code} {submission.phone_number}</p>
              </div>
              {submission.whatsapp_country_code && submission.whatsapp_number && (
                <div>
                  <label className="text-sm font-medium text-gray-600">WhatsApp Number</label>
                  <p className="font-medium">{submission.whatsapp_country_code} {submission.whatsapp_number}</p>
                </div>
              )}
            </div>
          </div>

          {/* Institution Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Institution Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Institution</label>
                <p className="font-medium">{submission.institution}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Department</label>
                <p className="font-medium">{submission.department}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Designation</label>
                <p className="font-medium">{submission.designation}</p>
              </div>
            </div>
          </div>

          {/* Paper Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Paper Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Paper Title</label>
                <p className="font-medium bg-white p-3 rounded border">{submission.paper_title}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Presentation Mode</label>
                  <p className="font-medium capitalize">{submission.presentation_mode.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Journal Publication</label>
                  <p className="font-medium capitalize">{submission.journal_publication}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          {submission.message && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Additional Message</h3>
              <p className="bg-white p-3 rounded border">{submission.message}</p>
            </div>
          )}

          {/* Document */}
          {submission.document_url && submission.document_name && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Uploaded Document</h3>
              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <span className="font-medium">{submission.document_name}</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDocument(submission.document_url!, submission.document_name!)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Submission Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Submission Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Submitted At</label>
                <p className="font-medium">{new Date(submission.submitted_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Submission ID</label>
                <p className="font-medium font-mono text-sm">{submission.id}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
