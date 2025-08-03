
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, X } from "lucide-react";
import { getFileForViewing } from "@/utils/localFileUpload";

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
  const [fileData, setFileData] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && documentUrl) {
      loadFile();
    }
  }, [isOpen, documentUrl]);

  const loadFile = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Extract filename from URL
      const fileName = documentUrl.split('/').pop() || '';
      console.log('Loading file for viewing:', fileName);
      
      // Get file data for viewing from GitHub
      const data = await getFileForViewing(fileName);
      if (data) {
        setFileData(data);
      } else {
        setError("File not found");
      }
    } catch (err) {
      console.error('Error loading file:', err);
      setError("Failed to load file");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (fileData) {
      // For GitHub URLs, we can directly download
      const link = document.createElement('a');
      link.href = fileData;
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
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-[800px] text-gray-500 space-y-4">
          <FileText className="h-16 w-16 mb-4 animate-pulse" />
          <p className="text-lg">Loading document...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[800px] text-red-500 space-y-4">
          <FileText className="h-16 w-16 mb-4" />
          <p className="text-lg">Error loading file</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    if (!fileData) {
      return (
        <div className="flex flex-col items-center justify-center h-[800px] text-gray-500 space-y-4">
          <FileText className="h-16 w-16 mb-4" />
          <p className="text-lg">No file data available</p>
        </div>
      );
    }

    const extension = getFileExtension(documentName);
    
    console.log('Document Name:', documentName);
    console.log('File Extension:', extension);
    
    if (extension === 'pdf') {
      return (
        <div className="w-full h-[800px]">
          <iframe
            src={`${fileData}#view=FitH`}
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
            src={fileData}
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
