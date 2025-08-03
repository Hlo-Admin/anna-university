
export const uploadFileLocally = async (file: File): Promise<{ url: string; name: string }> => {
  console.log('Starting local file upload for:', file.name);
  
  try {
    // Create a unique filename to avoid conflicts
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    
    // Create FormData to send file to local upload endpoint
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName);
    
    // Upload to local server endpoint
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('File uploaded locally:', result);
    
    return {
      url: result.path, // This will be something like /uploads/filename.ext
      name: file.name
    };
  } catch (error) {
    console.error('Local file upload error:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteFileLocally = async (filePath: string): Promise<void> => {
  try {
    const response = await fetch('/api/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath })
    });
    
    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
    
    console.log('File deleted successfully:', filePath);
  } catch (error) {
    console.error('Local file delete error:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
