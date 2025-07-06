
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
  const handleDownload = () => {
    const extension = getFileExtension(documentName);
    
    if (extension === 'pdf') {
      // Open PDF in new tab instead of downloading
      window.open(documentUrl, '_blank');
    } else {
      // For non-PDF files, download normally
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = documentName;
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
          className="w-full h-[600px] border rounded"
          title={documentName}
        />
      );
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return (
        <img
          src={documentUrl}
          alt={documentName}
          className="max-w-full max-h-[600px] object-contain mx-auto"
        />
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-[600px] text-gray-500">
          <FileText className="h-16 w-16 mb-4" />
          <p>Preview not available for this file type</p>
          <p className="text-sm">{documentName}</p>
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle>Document Preview</DialogTitle>
              <DialogDescription>{documentName}</DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {getFileExtension(documentName) === 'pdf' ? 'Open in New Tab' : 'Download'}
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
