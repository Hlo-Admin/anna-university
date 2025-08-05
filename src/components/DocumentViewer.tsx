
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, X } from "lucide-react";
import { getFile } from "@/utils/fileUpload";

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
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    if (isOpen && documentUrl) {
      // Check if this is a local file stored in localStorage
      if (documentUrl.startsWith('/uploads/')) {
        const localFile = getFile(documentUrl);
        if (localFile) {
          const blobUrl = URL.createObjectURL(localFile.blob);
          setPreviewUrl(blobUrl);
          console.log('Created blob URL for preview:', blobUrl);
        } else {
          // Try to access the file directly from the server
          setPreviewUrl(documentUrl);
        }
      } else {
        setPreviewUrl(documentUrl);
      }
    }

    // Cleanup blob URL when component unmounts or dialog closes
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, documentUrl]);

  const handleDownload = () => {
    if (documentUrl.startsWith('/uploads/')) {
      const localFile = getFile(documentUrl);
      if (localFile) {
        const url = URL.createObjectURL(localFile.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = documentName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }
    }
    
    // Fallback for regular URLs or server files
    const link = document.createElement('a');
    link.href = previewUrl || documentUrl;
    link.download = documentName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

    if (!previewUrl && !documentUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-[800px] text-gray-500 space-y-4">
          <FileText className="h-16 w-16 mb-4" />
          <p className="text-lg">No document to display</p>
        </div>
      );
    }

    const extension = getFileExtension(documentName);
    const urlToUse = previewUrl || documentUrl;
    
    console.log('Document URL:', urlToUse);
    console.log('Document Name:', documentName);
    console.log('File Extension:', extension);
    
    if (extension === 'pdf') {
      return (
        <div className="w-full h-[800px]">
          <iframe
            src={`${urlToUse}#view=FitH`}
            className="w-full h-full border rounded"
            title={documentName}
            onError={() => {
              setError('Failed to load PDF');
            }}
          />
        </div>
      );
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
      return (
        <div className="flex justify-center items-center w-full h-[800px]">
          <img
            src={urlToUse}
            alt={documentName}
            className="max-w-full max-h-full object-contain"
            onError={() => {
              setError('Failed to load image');
            }}
          />
        </div>
      );
    } else if (['doc', 'docx'].includes(extension)) {
      return (
        <div className="flex flex-col items-center justify-center h-[800px] text-gray-500 space-y-4">
          <FileText className="h-16 w-16 mb-4" />
          <p className="text-lg">Preview not available for Word documents</p>
          <p className="text-sm text-gray-400">{documentName}</p>
          <Button onClick={handleDownload} variant="outline">
            Download to View
          </Button>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-[800px] text-gray-500 space-y-4">
          <FileText className="h-16 w-16 mb-4" />
          <p className="text-lg">Preview not available for this file type</p>
          <p className="text-sm text-gray-400">{documentName}</p>
          <Button onClick={handleDownload} variant="outline">
            Download File
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
