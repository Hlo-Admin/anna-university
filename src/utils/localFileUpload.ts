
export const uploadFileLocally = async (file: File): Promise<{ url: string; name: string }> => {
  console.log('Starting local file upload for:', file.name);
  
  try {
    // Create a unique filename to avoid conflicts
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    
    // Convert file to base64 and store in localStorage as a fallback
    // In a real application, you'd want to send this to a backend
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        try {
          const base64Data = reader.result as string;
          
          // Store file data in localStorage (this is just for demo purposes)
          // In production, you'd send this to your backend server
          const fileData = {
            name: file.name,
            data: base64Data,
            type: file.type,
            uploadedAt: new Date().toISOString()
          };
          
          localStorage.setItem(`uploaded_file_${fileName}`, JSON.stringify(fileData));
          
          console.log('File stored locally:', fileName);
          
          resolve({
            url: `local://${fileName}`, // Custom protocol to indicate local storage
            name: file.name
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Local file upload error:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getLocalFile = (fileName: string): { name: string; data: string; type: string } | null => {
  try {
    const fileData = localStorage.getItem(`uploaded_file_${fileName}`);
    if (fileData) {
      return JSON.parse(fileData);
    }
    return null;
  } catch (error) {
    console.error('Error retrieving local file:', error);
    return null;
  }
};

export const deleteFileLocally = async (fileName: string): Promise<void> => {
  try {
    // Extract the actual filename from the URL if it's a local:// URL
    const actualFileName = fileName.replace('local://', '');
    localStorage.removeItem(`uploaded_file_${actualFileName}`);
    console.log('File deleted successfully:', fileName);
  } catch (error) {
    console.error('Local file delete error:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
