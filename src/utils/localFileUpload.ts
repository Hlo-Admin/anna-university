
// Re-export GitHub functions with the same interface for compatibility
export { 
  uploadFileToGitHub as uploadFileLocally,
  deleteFileFromGitHub as deleteFileLocally,
  getAllUploadedFilesFromGitHub as getAllUploadedFiles
} from './githubFileUpload';

// This function is no longer needed since files are stored on GitHub
export const getLocalFile = (fileName: string): { blob: Blob; name: string } | null => {
  console.warn('getLocalFile is deprecated - files are now stored on GitHub and accessed via direct URLs');
  return null;
};
