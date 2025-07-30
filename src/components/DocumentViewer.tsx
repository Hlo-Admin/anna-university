
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
      link.target = '_blank';
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
    
    console.log('Document URL:', documentUrl);
    console.log('Document Name:', documentName);
    console.log('File Extension:', extension);
    
    if (extension === 'pdf') {
      return (
        <div className="w-full h-[800px]">
          <iframe
            src={`${documentUrl}#view=FitH`}
            className="w-full h-full border rounded"
            title={documentName}
            onError={(e) => {
              console.error('PDF iframe error:', e);
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
    } else if (['doc', 'docx'].includes(extension)) {
      return (
        <div className="w-full h-[800px]">
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(documentUrl)}`}
            className="w-full h-full border rounded"
            title={documentName}
            onError={(e) => {
              console.error('Document viewer error:', e);
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
          <Button onClick={() => window.open(documentUrl, '_blank')} variant="outline">
            Open in New Tab
          </Button>
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
        
        <div className="overflow-auto max-h-[80vh]">
          {renderDocumentPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
