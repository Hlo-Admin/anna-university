
export const uploadFileLocally = async (file: File): Promise<{ url: string; name: string }> => {
  console.log('Starting file upload for:', file.name);
  
  try {
    // Create a unique filename to avoid conflicts
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    
    console.log('Generated filename:', fileName);
    
    // Convert file to base64 for transfer
    const base64Data = await convertFileToBase64(file);
    console.log('File converted to base64, size:', base64Data.length);
    
    // Write file to public/uploads directory
    const response = await fetch('/api/write-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: fileName,
        fileData: base64Data,
        originalName: file.name,
        fileType: file.type
      })
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('File uploaded successfully:', result);
    
    // Return the public URL
    const publicUrl = `/uploads/${fileName}`;
    console.log('Returning public URL:', publicUrl);
    
    return {
      url: publicUrl,
      name: file.name
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

export const getLocalFile = (fileName: string): { blob: Blob; name: string } | null => {
  // Since files are now stored in public/uploads, we don't need special handling
  // The browser can access them directly via their URL
  console.log('Files are now stored in public/uploads, accessible via URL:', fileName);
  return null; // Not needed for server-stored files
};

export const deleteFileLocally = async (filePath: string): Promise<void> => {
  try {
    console.log('Attempting to delete file:', filePath);
    
    // Extract filename from path
    const fileName = filePath.replace('/uploads/', '');
    
    const response = await fetch('/api/delete-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: fileName
      })
    });
    
    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
    
    console.log('File deleted successfully');
  } catch (error) {
    console.error('File delete error:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to get all uploaded files
export const getAllUploadedFiles = async () => {
  try {
    const response = await fetch('/api/list-files');
    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error retrieving file list:', error);
    return [];
  }
};
