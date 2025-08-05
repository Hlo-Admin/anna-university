
export const uploadFile = async (file: File): Promise<{ url: string; name: string }> => {
  console.log('Starting file upload for:', file.name);
  
  try {
    // Create a unique filename to avoid conflicts
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    
    // Convert file to base64 for sending
    const base64Data = await convertFileToBase64(file);
    
    // For development, we'll use a simple approach to store files
    // In production, this would hit your actual backend API
    const response = await fetch('/api/upload', {
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
      // If API doesn't work (development), fall back to localStorage
      console.log('API upload failed, using localStorage fallback');
      return uploadFileLocally(file);
    }
    
    const result = await response.json();
    
    return {
      url: result.path,
      name: file.name
    };
  } catch (error) {
    console.error('File upload error:', error);
    // Fallback to localStorage if server upload fails
    return uploadFileLocally(file);
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

// Fallback to localStorage when server upload is not available
const uploadFileLocally = async (file: File): Promise<{ url: string; name: string }> => {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${timestamp}_${sanitizedName}`;
  
  const fileData = await convertFileToBase64(file);
  
  const fileInfo = {
    fileName: fileName,
    originalName: file.name,
    fileType: file.type,
    data: fileData,
    uploadedAt: new Date().toISOString()
  };
  
  localStorage.setItem(`uploaded_file_${fileName}`, JSON.stringify(fileInfo));
  
  return {
    url: `/uploads/${fileName}`,
    name: file.name
  };
};

export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const response = await fetch('/api/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath })
    });
    
    if (!response.ok) {
      // Fallback to localStorage deletion
      const fileKey = filePath.replace('/uploads/', '');
      localStorage.removeItem(`uploaded_file_${fileKey}`);
    }
  } catch (error) {
    console.error('File delete error:', error);
    // Fallback to localStorage deletion
    const fileKey = filePath.replace('/uploads/', '');
    localStorage.removeItem(`uploaded_file_${fileKey}`);
  }
};

export const getFile = (fileName: string): { blob: Blob; name: string } | null => {
  try {
    const fileKey = fileName.startsWith('/uploads/') ? fileName.replace('/uploads/', '') : fileName;
    const fileInfoStr = localStorage.getItem(`uploaded_file_${fileKey}`);
    
    if (!fileInfoStr) {
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
