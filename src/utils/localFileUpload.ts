
export const uploadFileLocally = async (file: File): Promise<{ url: string; name: string }> => {
  console.log('Starting file upload for:', file.name);
  
  try {
    // Create a unique filename to avoid conflicts
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    
    console.log('Generated filename:', fileName);
    
    // Create FormData for server upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName);
    
    // Upload to server
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(errorData.message || 'Upload failed');
    }
    
    const result = await response.json();
    console.log('File uploaded successfully:', result);
    
    return {
      url: result.path, // This will be like "/uploads/filename"
      name: file.name
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getLocalFile = (fileName: string): { blob: Blob; name: string } | null => {
  console.log('getLocalFile is deprecated - files are now stored on server');
  return null;
};

export const deleteFileLocally = async (filePath: string): Promise<void> => {
  try {
    console.log('Attempting to delete file:', filePath);
    
    const response = await fetch('/api/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Delete failed' }));
      throw new Error(errorData.message || 'Delete failed');
    }
    
    console.log('File deleted successfully');
  } catch (error) {
    console.error('File delete error:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
