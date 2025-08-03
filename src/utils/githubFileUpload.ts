
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER;
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO;

export const uploadFileToGitHub = async (file: File): Promise<{ url: string; name: string }> => {
  console.log('Starting GitHub file upload for:', file.name);
  
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error('GitHub configuration missing. Please set VITE_GITHUB_TOKEN, VITE_GITHUB_OWNER, and VITE_GITHUB_REPO environment variables.');
  }
  
  try {
    // Create a unique filename to avoid conflicts
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    
    console.log('Generated filename:', fileName);
    
    // Convert file to base64
    const base64Data = await convertFileToBase64(file);
    const base64Content = base64Data.split(',')[1]; // Remove data:mime;base64, prefix
    
    console.log('File converted to base64, uploading to GitHub...');
    
    // Upload to GitHub using the Contents API
    const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/public/uploads/${fileName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: `Upload file: ${file.name}`,
        content: base64Content,
        branch: 'main'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`GitHub API error: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    console.log('File uploaded successfully to GitHub:', result.content.download_url);
    
    return {
      url: result.content.download_url,
      name: file.name
    };
  } catch (error) {
    console.error('GitHub file upload error:', error);
    throw new Error(`Failed to upload file to GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

export const deleteFileFromGitHub = async (fileName: string): Promise<void> => {
  console.log('Attempting to delete file from GitHub:', fileName);
  
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error('GitHub configuration missing.');
  }

  try {
    // First, get the file to obtain its SHA (required for deletion)
    const getResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/public/uploads/${fileName}`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!getResponse.ok) {
      if (getResponse.status === 404) {
        console.log('File not found on GitHub');
        return;
      }
      throw new Error(`Failed to get file info: ${getResponse.statusText}`);
    }

    const fileData = await getResponse.json();
    
    // Delete the file
    const deleteResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/public/uploads/${fileName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: `Delete file: ${fileName}`,
        sha: fileData.sha,
        branch: 'main'
      })
    });

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      throw new Error(`GitHub API error: ${errorData.message || deleteResponse.statusText}`);
    }

    console.log('File deleted successfully from GitHub');
  } catch (error) {
    console.error('GitHub file delete error:', error);
    throw new Error(`Failed to delete file from GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getAllUploadedFilesFromGitHub = async () => {
  console.log('Fetching uploaded files from GitHub');
  
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error('GitHub configuration missing.');
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/public/uploads`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('Uploads directory not found, returning empty list');
        return [];
      }
      throw new Error(`Failed to fetch files: ${response.statusText}`);
    }

    const files = await response.json();
    
    return files
      .filter((file: any) => file.type === 'file' && file.name !== '.gitkeep')
      .map((file: any) => ({
        fileName: file.name,
        originalName: file.name.split('_').slice(1).join('_'), // Remove timestamp prefix
        uploadedAt: new Date().toISOString(), // GitHub doesn't provide upload time via this API
        url: file.download_url,
        size: file.size,
        type: 'application/octet-stream' // Default type since GitHub doesn't store MIME type
      }));
  } catch (error) {
    console.error('Error retrieving file list from GitHub:', error);
    return [];
  }
};
