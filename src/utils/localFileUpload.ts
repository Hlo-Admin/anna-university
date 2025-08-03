
import { uploadFileToGitHub, deleteFileFromGitHub, getAllUploadedFilesFromGitHub } from './githubFileUpload';

// Use GitHub for file storage
export const uploadFileLocally = uploadFileToGitHub;
export const deleteFileLocally = deleteFileFromGitHub;
export const getAllUploadedFiles = getAllUploadedFilesFromGitHub;

// Helper function to get file data for viewing from GitHub
export const getFileForViewing = async (fileName: string): Promise<string | null> => {
  try {
    const files = await getAllUploadedFilesFromGitHub();
    const file = files.find((f: any) => f.fileName === fileName);
    if (file && file.url) {
      return file.url; // Return the GitHub download URL directly
    }
    return null;
  } catch (error) {
    console.error('Error getting file for viewing:', error);
    return null;
  }
};

// Convert file to base64 (utility function)
export const convertFileToBase64 = (file: File): Promise<string> => {
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
