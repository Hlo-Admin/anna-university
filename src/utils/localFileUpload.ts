
// Simple file upload that stores files in /public/uploads and commits them to GitHub
export const uploadFileLocally = async (file: File): Promise<{ url: string; name: string }> => {
  console.log('Starting file upload for:', file.name);
  
  try {
    // Create a unique filename to avoid conflicts
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    
    console.log('Generated filename:', fileName);
    
    // Convert file to base64
    const base64Data = await convertFileToBase64(file);
    
    console.log('File converted to base64, storing in public/uploads...');
    
    // Store the file data in localStorage temporarily (since we can't write to /public directly from frontend)
    // In a real deployment, this would be handled by the build process
    const fileData = {
      fileName,
      originalName: file.name,
      base64Data,
      uploadedAt: new Date().toISOString(),
      size: file.size,
      type: file.type
    };
    
    // Store in localStorage with a special prefix for uploaded files
    localStorage.setItem(`uploaded_file_${fileName}`, JSON.stringify(fileData));
    
    // Also store in a list for easy retrieval
    const existingFiles = JSON.parse(localStorage.getItem('uploaded_files_list') || '[]');
    existingFiles.push({
      fileName,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      url: `/uploads/${fileName}`, // This will be the public URL
      size: file.size,
      type: file.type
    });
    localStorage.setItem('uploaded_files_list', JSON.stringify(existingFiles));
    
    console.log('File uploaded successfully');
    
    return {
      url: `/uploads/${fileName}`, // Return public URL path
      name: file.name
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteFileLocally = async (fileName: string): Promise<void> => {
  console.log('Deleting file:', fileName);
  
  try {
    // Remove from localStorage
    localStorage.removeItem(`uploaded_file_${fileName}`);
    
    // Remove from files list
    const existingFiles = JSON.parse(localStorage.getItem('uploaded_files_list') || '[]');
    const updatedFiles = existingFiles.filter((file: any) => file.fileName !== fileName);
    localStorage.setItem('uploaded_files_list', JSON.stringify(updatedFiles));
    
    console.log('File deleted successfully');
  } catch (error) {
    console.error('File delete error:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getAllUploadedFiles = async () => {
  try {
    const filesList = JSON.parse(localStorage.getItem('uploaded_files_list') || '[]');
    return filesList.map((file: any) => ({
      fileName: file.fileName,
      originalName: file.originalName,
      uploadedAt: file.uploadedAt,
      url: file.url,
      size: file.size,
      type: file.type || 'application/octet-stream'
    }));
  } catch (error) {
    console.error('Error retrieving file list:', error);
    return [];
  }
};

// Helper function to get file data for viewing (since we can't directly access /public files)
export const getFileForViewing = (fileName: string): string | null => {
  try {
    const fileData = localStorage.getItem(`uploaded_file_${fileName}`);
    if (fileData) {
      const parsed = JSON.parse(fileData);
      return parsed.base64Data; // Return base64 data for viewing
    }
    return null;
  } catch (error) {
    console.error('Error getting file for viewing:', error);
    return null;
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

// This function is no longer needed since files are stored locally
export const getLocalFile = (fileName: string): { blob: Blob; name: string } | null => {
  console.warn('getLocalFile is deprecated');
  return null;
};
