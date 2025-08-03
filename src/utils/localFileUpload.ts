
export const uploadFileLocally = async (file: File): Promise<{ url: string; name: string }> => {
  console.log('Starting local file upload for:', file.name);
  
  try {
    // Create a unique filename to avoid conflicts
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    
    console.log('Generated filename:', fileName);
    
    // Convert file to base64 for local storage
    const fileBuffer = await file.arrayBuffer();
    const base64String = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
    const mimeType = file.type || 'application/octet-stream';
    
    console.log('File converted to base64, size:', base64String.length);
    
    // Store in localStorage with metadata
    const fileData = {
      name: file.name,
      fileName: fileName,
      mimeType: mimeType,
      data: base64String,
      uploadedAt: new Date().toISOString(),
      size: file.size
    };
    
    // Check localStorage space before storing
    const jsonString = JSON.stringify(fileData);
    console.log('Attempting to store file data, JSON size:', jsonString.length);
    
    try {
      localStorage.setItem(`file_${fileName}`, jsonString);
      console.log('File stored successfully in localStorage with key:', `file_${fileName}`);
      
      // Verify the file was stored
      const stored = localStorage.getItem(`file_${fileName}`);
      if (!stored) {
        throw new Error('File was not stored properly in localStorage');
      }
      
      console.log('File verification successful');
      
    } catch (storageError) {
      console.error('localStorage storage error:', storageError);
      throw new Error(`Failed to store file in localStorage: ${storageError.message}`);
    }
    
    // Return a local URL that we can use to retrieve the file
    return {
      url: `local://${fileName}`,
      name: file.name
    };
  } catch (error) {
    console.error('Local file upload error:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getLocalFile = (fileName: string): { blob: Blob; name: string } | null => {
  console.log('Attempting to retrieve file:', fileName);
  
  try {
    const fileData = localStorage.getItem(`file_${fileName}`);
    console.log('Raw file data retrieved:', !!fileData);
    
    if (!fileData) {
      console.error('File not found in localStorage with key:', `file_${fileName}`);
      
      // Debug: List all localStorage keys that start with 'file_'
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('file_'));
      console.log('Available file keys in localStorage:', allKeys);
      
      return null;
    }
    
    const parsed = JSON.parse(fileData);
    console.log('Parsed file data:', { name: parsed.name, mimeType: parsed.mimeType, dataLength: parsed.data?.length });
    
    if (!parsed.data) {
      console.error('No data found in stored file');
      return null;
    }
    
    const binaryString = atob(parsed.data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: parsed.mimeType });
    console.log('Successfully created blob:', { size: blob.size, type: blob.type });
    
    return { blob, name: parsed.name };
  } catch (error) {
    console.error('Error retrieving local file:', error);
    return null;
  }
};

export const deleteFileLocally = async (filePath: string): Promise<void> => {
  try {
    // Extract filename from local:// URL
    const fileName = filePath.replace('local://', '');
    console.log('Attempting to delete file:', fileName);
    
    const key = `file_${fileName}`;
    const exists = localStorage.getItem(key);
    
    if (!exists) {
      console.warn('File not found for deletion:', key);
    }
    
    localStorage.removeItem(key);
    console.log('File deleted successfully:', fileName);
  } catch (error) {
    console.error('Local file delete error:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
