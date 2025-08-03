
export const uploadFileLocally = async (file: File): Promise<{ url: string; name: string }> => {
  console.log('Starting file upload for:', file.name);
  
  try {
    // Create a unique filename to avoid conflicts
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    
    console.log('Generated filename:', fileName);
    
    // Convert file to base64 for storage
    const base64Data = await convertFileToBase64(file);
    console.log('File converted to base64, size:', base64Data.length);
    
    // Store in localStorage with a special key
    const storageKey = `uploaded_file_${fileName}`;
    const fileData = {
      name: file.name,
      originalName: file.name,
      fileName: fileName,
      data: base64Data,
      uploadedAt: new Date().toISOString(),
      type: file.type,
      size: file.size
    };
    
    localStorage.setItem(storageKey, JSON.stringify(fileData));
    console.log('File stored in localStorage with key:', storageKey);
    
    // Return a special URL that we can handle in the document viewer
    const fileUrl = `local://${fileName}`;
    console.log('Returning file URL:', fileUrl);
    
    return {
      url: fileUrl,
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
  try {
    console.log('Retrieving file:', fileName);
    
    // Extract filename from local:// URL if needed
    const actualFileName = fileName.replace('local://', '');
    const storageKey = `uploaded_file_${actualFileName}`;
    
    console.log('Looking for storage key:', storageKey);
    
    // List all localStorage keys for debugging
    console.log('All localStorage keys:', Object.keys(localStorage).filter(key => key.startsWith('uploaded_file_')));
    
    const storedData = localStorage.getItem(storageKey);
    if (!storedData) {
      console.error('File not found in localStorage');
      return null;
    }
    
    const fileData = JSON.parse(storedData);
    console.log('Retrieved file data:', fileData.name, fileData.size);
    
    // Convert base64 back to blob
    const base64Data = fileData.data.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: fileData.type });
    
    return {
      blob,
      name: fileData.originalName
    };
  } catch (error) {
    console.error('Error retrieving file:', error);
    return null;
  }
};

export const deleteFileLocally = async (filePath: string): Promise<void> => {
  try {
    console.log('Attempting to delete file:', filePath);
    
    // Extract filename from local:// URL if needed
    const fileName = filePath.replace('local://', '');
    const storageKey = `uploaded_file_${fileName}`;
    
    console.log('Deleting storage key:', storageKey);
    
    localStorage.removeItem(storageKey);
    console.log('File deleted successfully from localStorage');
  } catch (error) {
    console.error('File delete error:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to get all uploaded files
export const getAllUploadedFiles = async () => {
  try {
    const files = [];
    const keys = Object.keys(localStorage).filter(key => key.startsWith('uploaded_file_'));
    
    for (const key of keys) {
      try {
        const fileData = JSON.parse(localStorage.getItem(key) || '{}');
        files.push({
          fileName: fileData.fileName,
          originalName: fileData.originalName,
          uploadedAt: fileData.uploadedAt,
          url: `local://${fileData.fileName}`,
          size: fileData.size,
          type: fileData.type
        });
      } catch (error) {
        console.error('Error parsing stored file:', key, error);
      }
    }
    
    return files;
  } catch (error) {
    console.error('Error retrieving file list:', error);
    return [];
  }
};
