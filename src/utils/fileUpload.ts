import { supabase } from "@/integrations/supabase/client";

export const uploadFile = async (file: File): Promise<{ url: string; name: string }> => {
  console.log('Starting Google Drive upload for:', file.name);
  
  try {
    // Convert file to base64
    const base64Data = await convertFileToBase64(file);
    
    // Call the Google Drive upload edge function
    const { data, error } = await supabase.functions.invoke('google-drive-upload', {
      body: {
        fileName: file.name,
        fileData: base64Data,
        originalName: file.name,
        fileType: file.type
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    console.log('File uploaded to Google Drive successfully:', data.fileId);

    return {
      url: data.fileUrl,
      name: file.name
    };
  } catch (error) {
    console.error('File upload error:', error);
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

// Keep these functions for backward compatibility but they won't be used
export const deleteFile = async (filePath: string): Promise<void> => {
  console.log('Delete function called, but files are stored in Google Drive');
};

export const getFile = (fileName: string): { blob: Blob; name: string } | null => {
  console.log('Get file function called, but files are stored in Google Drive');
  return null;
};
