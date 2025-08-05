
export const uploadFileLocally = async (file: File): Promise<{ url: string; name: string }> => {
  console.log('Starting file upload for:', file.name);
  
  try {
    // Create a unique filename to avoid conflicts
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    
    console.log('Generated filename:', fileName);
    
    // For development, we'll store the file data in localStorage
    // and create a blob URL for immediate access
    const fileData = await convertFileToBase64(file);
    
    // Store file metadata and data in localStorage
    const fileInfo = {
      fileName: fileName,
      originalName: file.name,
      fileType: file.type,
      data: fileData,
      uploadedAt: new Date().toISOString()
    };
    
    // Store in localStorage with a key pattern
    localStorage.setItem(`uploaded_file_${fileName}`, JSON.stringify(fileInfo));
    
    // Create a blob URL for immediate access
    const blob = dataURLToBlob(fileData);
    const blobUrl = URL.createObjectURL(blob);
    
    // Store the blob URL mapping
    localStorage.setItem(`blob_url_${fileName}`, blobUrl);
    
    console.log('File uploaded successfully to localStorage');
    
    // Return a local reference
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

const dataURLToBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || '';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export const getLocalFile = (fileName: string): { blob: Blob; name: string } | null => {
  try {
    const fileKey = fileName.startsWith('/uploads/') ? fileName.replace('/uploads/', '') : fileName;
    const fileInfoStr = localStorage.getItem(`uploaded_file_${fileKey}`);
    
    if (!fileInfoStr) {
      console.log('File not found in localStorage:', fileKey);
      return null;
    }
    
    const fileInfo = JSON.parse(fileInfoStr);
    const blob = dataURLToBlob(fileInfo.data);
    
    return {
      blob: blob,
      name: fileInfo.originalName
    };
  } catch (error) {
    console.error('Error retrieving file:', error);
    return null;
  }
};

export const deleteFileLocally = async (filePath: string): Promise<void> => {
  try {
    console.log('Attempting to delete file:', filePath);
    
    const fileKey = filePath.replace('/uploads/', '');
    
    // Remove from localStorage
    localStorage.removeItem(`uploaded_file_${fileKey}`);
    
    // Revoke blob URL if it exists
    const blobUrl = localStorage.getItem(`blob_url_${fileKey}`);
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      localStorage.removeItem(`blob_url_${fileKey}`);
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
    const files = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('uploaded_file_')) {
        const fileInfoStr = localStorage.getItem(key);
        if (fileInfoStr) {
          const fileInfo = JSON.parse(fileInfoStr);
          files.push({
            fileName: fileInfo.fileName,
            originalName: fileInfo.originalName,
            uploadedAt: fileInfo.uploadedAt,
            url: `/uploads/${fileInfo.fileName}`,
            size: Math.round(fileInfo.data.length * 0.75) // Approximate size from base64
          });
        }
      }
    }
    
    return files;
  } catch (error) {
    console.error('Error retrieving file list:', error);
    return [];
  }
};
