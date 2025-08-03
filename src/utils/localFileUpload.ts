
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
    console.log('Storing with key:', storageKey);
    localStorage.setItem(storageKey, JSON.stringify(fileData));
    
    // Verify storage
    const storedData = localStorage.getItem(storageKey);
    console.log('Verification - stored data exists:', !!storedData);
    
    // Also maintain an index of all uploaded files
    const fileIndex = JSON.parse(localStorage.getItem('file_index') || '[]');
    fileIndex.push({
      key: storageKey,
      fileName: fileName,
      originalName: file.name,
      uploadedAt: fileData.uploadedAt
    });
    localStorage.setItem('file_index', JSON.stringify(fileIndex));
    console.log('Updated file index, total files:', fileIndex.length);
    
    console.log('File stored successfully in localStorage');
    
    // Return a virtual URL that we can use to retrieve the file
    const virtualUrl = `local://uploads/${fileName}`;
    console.log('Returning virtual URL:', virtualUrl);
    
    return {
      url: virtualUrl,
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
    
    // Handle both local:// URLs and direct /uploads/ paths
    let actualFileName = fileName;
    if (fileName.startsWith('local://uploads/')) {
      actualFileName = fileName.replace('local://uploads/', '');
    } else if (fileName.startsWith('/uploads/')) {
      actualFileName = fileName.replace('/uploads/', '');
    }
    
    console.log('Actual filename to search:', actualFileName);
    
    const storageKey = `file_${actualFileName}`;
    console.log('Looking for storage key:', storageKey);
    
    // Debug: List all localStorage keys that start with 'file_'
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('file_')) {
        allKeys.push(key);
      }
    }
    console.log('All file keys in localStorage:', allKeys);
    
    const storedData = localStorage.getItem(storageKey);
    if (!storedData) {
      console.log('File not found in localStorage for key:', storageKey);
      return null;
    }
    
    console.log('Found stored data, parsing...');
    const fileData = JSON.parse(storedData);
    console.log('File data parsed successfully, type:', fileData.type);
    
    // Convert base64 back to blob
    const base64Data = fileData.data.split(',')[1]; // Remove data URL prefix
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: fileData.type });
    
    console.log('File retrieved successfully, blob size:', blob.size);
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
    
    // Handle both local:// URLs and direct /uploads/ paths
    let actualFileName = filePath;
    if (filePath.startsWith('local://uploads/')) {
      actualFileName = filePath.replace('local://uploads/', '');
    } else if (filePath.startsWith('/uploads/')) {
      actualFileName = filePath.replace('/uploads/', '');
    }
    
    const storageKey = `file_${actualFileName}`;
    console.log('Deleting storage key:', storageKey);
    
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
