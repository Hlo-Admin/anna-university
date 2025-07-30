
import React from "react";
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
  const handleDownload = () => {
    // For Google Drive links, we'll open the download URL in a new tab
    const downloadUrl = documentUrl.replace('/view', '/export?format=pdf');
    window.open(downloadUrl, '_blank');
  };

  const handleOpenInDrive = () => {
    window.open(documentUrl, '_blank');
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const renderDocumentPreview = () => {
    const extension = getFileExtension(documentName);
    
    console.log('Google Drive Document URL:', documentUrl);
    console.log('Document Name:', documentName);
    console.log('File Extension:', extension);
    
    // For Google Drive documents, we'll use the embed URL
    const embedUrl = documentUrl.replace('/view', '/preview');
    
    if (['doc', 'docx'].includes(extension)) {
      return (
        <div className="w-full h-[800px]">
          <iframe
            src={embedUrl}
            className="w-full h-full border rounded"
            title={documentName}
            onError={(e) => {
              console.error('Google Drive embed error:', e);
            }}
          />
        </div>
      );
    } else if (['pdf'].includes(extension)) {
      return (
        <div className="w-full h-[800px]">
          <iframe
            src={embedUrl}
            className="w-full h-full border rounded"
            title={documentName}
            onError={(e) => {
              console.error('PDF preview error:', e);
            }}
          />
        </div>
      );
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
      return (
        <div className="flex justify-center items-center w-full h-[800px]">
          <img
            src={documentUrl}
            alt={documentName}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              console.error('Image load error:', e);
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-[800px] text-gray-500 space-y-4">
          <FileText className="h-16 w-16 mb-4" />
          <p className="text-lg">Preview not available for this file type</p>
          <p className="text-sm text-gray-400">{documentName}</p>
          <div className="flex gap-2">
            <Button onClick={handleOpenInDrive} variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Google Drive
            </Button>
          </div>
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle>Document Preview</DialogTitle>
              <DialogDescription>{documentName}</DialogDescription>
              <p className="text-xs text-blue-600 mt-1">Stored in Google Drive</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleOpenInDrive} variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Drive
              </Button>
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
