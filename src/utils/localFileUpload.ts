
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
    
    // Store file data in localStorage with metadata
    const fileData = {
      name: file.name,
      originalName: file.name,
      size: file.size,
      type: file.type,
      data: base64Data,
      uploadedAt: new Date().toISOString()
    };
    
    // Store in localStorage
    const storageKey = `file_${fileName}`;
    localStorage.setItem(storageKey, JSON.stringify(fileData));
    
    // Also maintain an index of all uploaded files
    const fileIndex = JSON.parse(localStorage.getItem('file_index') || '[]');
    fileIndex.push({
      key: storageKey,
      fileName: fileName,
      originalName: file.name,
      uploadedAt: fileData.uploadedAt
    });
    localStorage.setItem('file_index', JSON.stringify(fileIndex));
    
    console.log('File stored successfully in localStorage');
    
    // Return a virtual URL that we can use to retrieve the file
    return {
      url: `/uploads/${fileName}`,
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
    
    // Extract the actual filename from the URL path
    const actualFileName = fileName.replace('/uploads/', '');
    const storageKey = `file_${actualFileName}`;
    
    const storedData = localStorage.getItem(storageKey);
    if (!storedData) {
      console.log('File not found in localStorage');
      return null;
    }
    
    const fileData = JSON.parse(storedData);
    
    // Convert base64 back to blob
    const base64Data = fileData.data.split(',')[1]; // Remove data URL prefix
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: fileData.type });
    
    console.log('File retrieved successfully');
    return {
      blob: blob,
      name: fileData.originalName
    };
  } catch (error) {
    console.error('File retrieval error:', error);
    return null;
  }
};

export const deleteFileLocally = async (filePath: string): Promise<void> => {
  try {
    console.log('Attempting to delete file:', filePath);
    
    // Extract the actual filename from the URL path
    const actualFileName = filePath.replace('/uploads/', '');
    const storageKey = `file_${actualFileName}`;
    
    // Remove from localStorage
    localStorage.removeItem(storageKey);
    
    // Update file index
    const fileIndex = JSON.parse(localStorage.getItem('file_index') || '[]');
    const updatedIndex = fileIndex.filter((item: any) => item.key !== storageKey);
    localStorage.setItem('file_index', JSON.stringify(updatedIndex));
    
    console.log('File deleted successfully');
  } catch (error) {
    console.error('File delete error:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to get all uploaded files (useful for admin panel)
export const getAllUploadedFiles = () => {
  try {
    const fileIndex = JSON.parse(localStorage.getItem('file_index') || '[]');
    return fileIndex.map((item: any) => ({
      fileName: item.fileName,
      originalName: item.originalName,
      uploadedAt: item.uploadedAt,
      url: `/uploads/${item.fileName}`
    }));
  } catch (error) {
    console.error('Error retrieving file list:', error);
    return [];
  }
};
