
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, X } from "lucide-react";

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
  const handleDownload = async () => {
    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = documentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to direct download
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = documentName;
      link.target = '_self';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const renderDocumentPreview = () => {
    const extension = getFileExtension(documentName);
    
    if (extension === 'pdf') {
      return (
        <iframe
          src={documentUrl}
          className="w-full h-[900px] border rounded"
          title={documentName}
        />
      );
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return (
        <img
          src={documentUrl}
          alt={documentName}
          className="max-w-full max-h-[900px] object-contain mx-auto"
        />
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-[900px] text-gray-500">
          <FileText className="h-16 w-16 mb-4" />
          <p>Preview not available for this file type</p>
          <p className="text-sm">{documentName}</p>
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle>Document Preview</DialogTitle>
              <DialogDescription>{documentName}</DialogDescription>
            </div>
            <div className="flex gap-2">
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
        
        <div className="mt-4">
          {renderDocumentPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
