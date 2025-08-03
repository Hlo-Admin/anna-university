
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, X } from "lucide-react";
import { getLocalFile } from "@/utils/localFileUpload";

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
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (documentUrl.startsWith('local://')) {
      const fileName = documentUrl.replace('local://', '');
      const fileData = getLocalFile(fileName);
      
      if (fileData) {
        const url = URL.createObjectURL(fileData.blob);
        setBlobUrl(url);
        setError("");
        
        return () => {
          URL.revokeObjectURL(url);
        };
      } else {
        setError("File not found in local storage");
      }
    } else {
      setBlobUrl(documentUrl);
    }
  }, [documentUrl]);

  const handleDownload = async () => {
    try {
      let blob: Blob;
      let filename = documentName;

      if (documentUrl.startsWith('local://')) {
        const fileName = documentUrl.replace('local://', '');
        const fileData = getLocalFile(fileName);
        if (!fileData) {
          throw new Error('File not found');
        }
        blob = fileData.blob;
        filename = fileData.name;
      } else {
        const response = await fetch(documentUrl);
        blob = await response.blob();
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
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

    if (!blobUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-[800px] text-gray-500 space-y-4">
          <FileText className="h-16 w-16 mb-4" />
          <p className="text-lg">Loading file...</p>
        </div>
      );
    }

    const extension = getFileExtension(documentName);
    
    console.log('Document URL:', documentUrl);
    console.log('Blob URL:', blobUrl);
    console.log('Document Name:', documentName);
    console.log('File Extension:', extension);
    
    if (extension === 'pdf') {
      return (
        <div className="w-full h-[800px]">
          <iframe
            src={`${blobUrl}#view=FitH`}
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
            src={blobUrl}
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
