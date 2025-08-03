
export const uploadFileLocally = async (file: File): Promise<{ url: string; name: string }> => {
  console.log('Starting local file upload for:', file.name);
  
  try {
    // Create a unique filename to avoid conflicts
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    
    // Convert file to base64 for local storage
    const fileBuffer = await file.arrayBuffer();
    const base64String = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
    const mimeType = file.type || 'application/octet-stream';
    
    // Store in localStorage with metadata
    const fileData = {
      name: file.name,
      fileName: fileName,
      mimeType: mimeType,
      data: base64String,
      uploadedAt: new Date().toISOString()
    };
    
    localStorage.setItem(`file_${fileName}`, JSON.stringify(fileData));
    
    console.log('File stored locally:', fileName);
    
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
  try {
    const fileData = localStorage.getItem(`file_${fileName}`);
    if (!fileData) {
      console.error('File not found in localStorage:', fileName);
      return null;
    }
    
    const parsed = JSON.parse(fileData);
    const binaryString = atob(parsed.data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: parsed.mimeType });
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
    localStorage.removeItem(`file_${fileName}`);
    console.log('File deleted successfully:', fileName);
  } catch (error) {
    console.error('Local file delete error:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
