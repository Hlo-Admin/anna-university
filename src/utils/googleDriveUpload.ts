
import { supabase } from "@/integrations/supabase/client";

interface GoogleDriveUploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  viewUrl?: string;
  downloadUrl?: string;
  error?: string;
}

export const uploadToGoogleDrive = async (file: File): Promise<{ url: string; name: string; fileId: string }> => {
  console.log('Starting Google Drive upload for:', file.name);
  
  try {
    // Convert file to base64
    const base64Data = await convertFileToBase64(file);
    
    // Call the Google Drive upload edge function
    const { data, error } = await supabase.functions.invoke('google-drive-upload', {
      body: {
        fileName: file.name,
        fileData: base64Data,
        mimeType: file.type || 'application/octet-stream'
      }
    });
    
    if (error) {
      console.error('Google Drive upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    const result: GoogleDriveUploadResult = data;
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }
    
    console.log('Successfully uploaded to Google Drive:', result.fileId);
    
    return {
      url: result.viewUrl!,
      name: file.name,
      fileId: result.fileId!
    };
    
  } catch (error) {
    console.error('Google Drive upload error:', error);
    throw error;
  }
};

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export const getGoogleDriveFileUrl = (fileId: string): string => {
  return `https://drive.google.com/file/d/${fileId}/view`;
};

export const getGoogleDriveDownloadUrl = (fileId: string): string => {
  return `https://drive.google.com/uc?id=${fileId}&export=download`;
};
