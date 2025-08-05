
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, X, ExternalLink } from "lucide-react";

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  documentName: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isOpen,
  onClose,
  documentUrl,
  documentName
}) => {
  const [error, setError] = useState<string>("");

  const handleDownload = () => {
    // For Google Drive files, extract file ID and create download URL
    if (documentUrl.includes('drive.google.com/file/d/')) {
      const fileId = documentUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (fileId) {
        const downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
        window.open(downloadUrl, '_blank');
        return;
      }
    }
    
    // Fallback for other URLs
    window.open(documentUrl, '_blank');
  };

  const handleViewInGoogleDrive = () => {
    window.open(documentUrl, '_blank');
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const renderDocumentPreview = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[800px] text-red-500 space-y-4">
          <FileText className="h-16 w-16 mb-4" />
          <p className="text-lg">Error loading file</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    if (!documentUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-[800px] text-gray-500 space-y-4">
          <FileText className="h-16 w-16 mb-4" />
          <p className="text-lg">No document to display</p>
        </div>
      );
    }

    const extension = getFileExtension(documentName);
    
    // For Google Drive files, show a preview message and buttons
    if (documentUrl.includes('drive.google.com')) {
      return (
        <div className="flex flex-col items-center justify-center h-[800px] text-gray-600 space-y-6">
          <FileText className="h-20 w-20 mb-4 text-blue-600" />
          <div className="text-center space-y-2">
            <p className="text-xl font-semibold">Document stored in Google Drive</p>
            <p className="text-lg text-gray-500">{documentName}</p>
            <p className="text-sm text-gray-400">File type: {extension.toUpperCase()}</p>
          </div>
          
          <div className="flex gap-4 mt-8">
            <Button 
              onClick={handleViewInGoogleDrive} 
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View in Google Drive
            </Button>
            <Button 
              onClick={handleDownload} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download File
            </Button>
          </div>
          
          <div className="text-xs text-gray-400 mt-4 text-center max-w-md">
            This document is securely stored in Google Drive. Click "View in Google Drive" to preview the document or "Download File" to save it to your device.
          </div>
        </div>
      );
    }

    // Fallback for non-Google Drive files
    return (
      <div className="flex flex-col items-center justify-center h-[800px] text-gray-500 space-y-4">
        <FileText className="h-16 w-16 mb-4" />
        <p className="text-lg">Preview not available</p>
        <p className="text-sm text-gray-400">{documentName}</p>
        <Button onClick={handleDownload} variant="outline">
          Download File
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle>Document Preview</DialogTitle>
              <DialogDescription>{documentName}</DialogDescription>
            </div>
            <div className="flex gap-2">
              {documentUrl.includes('drive.google.com') && (
                <Button onClick={handleViewInGoogleDrive} variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Drive
                </Button>
              )}
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={onClose} variant="outline" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="overflow-auto max-h-[80vh]">
          {renderDocumentPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
