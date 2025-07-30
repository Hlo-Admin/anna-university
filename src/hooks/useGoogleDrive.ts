
import { useState, useCallback } from 'react';
import GoogleDriveService, { type UploadedFile } from '@/services/googleDriveService';

interface UseGoogleDriveProps {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken?: string;
}

export const useGoogleDrive = (config: UseGoogleDriveProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [driveService] = useState(() => new GoogleDriveService(config));

  const uploadFile = useCallback(async (file: File, fileName?: string, folderId?: string): Promise<UploadedFile> => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const finalFileName = fileName || `${file.name.split('.')[0]}_${Date.now()}.${file.name.split('.').pop()}`;
      setUploadProgress(50);
      
      const uploadedFile = await driveService.uploadFile(file, finalFileName, folderId);
      setUploadProgress(100);
      
      return uploadedFile;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [driveService]);

  const deleteFile = useCallback(async (fileId: string): Promise<void> => {
    try {
      await driveService.deleteFile(fileId);
    } catch (error) {
      console.error('Delete failed:', error);
      throw error;
    }
  }, [driveService]);

  const getFile = useCallback(async (fileId: string) => {
    try {
      return await driveService.getFile(fileId);
    } catch (error) {
      console.error('Get file failed:', error);
      throw error;
    }
  }, [driveService]);

  const createFolder = useCallback(async (name: string, parentFolderId?: string): Promise<string> => {
    try {
      return await driveService.createFolder(name, parentFolderId);
    } catch (error) {
      console.error('Create folder failed:', error);
      throw error;
    }
  }, [driveService]);

  const getAuthUrl = useCallback((): string => {
    return driveService.getAuthUrl();
  }, [driveService]);

  const getAccessToken = useCallback(async (code: string) => {
    try {
      return await driveService.getAccessToken(code);
    } catch (error) {
      console.error('Get access token failed:', error);
      throw error;
    }
  }, [driveService]);

  return {
    uploadFile,
    deleteFile,
    getFile,
    createFolder,
    getAuthUrl,
    getAccessToken,
    isUploading,
    uploadProgress
  };
};
