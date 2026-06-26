import { useState, useCallback } from 'react';
import { fileService } from '../services/fileService';
import toast from 'react-hot-toast';

export const useUpload = (onSuccess) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadQueue, setUploadQueue] = useState([]);

  const uploadFiles = useCallback(async (files, folderId = null) => {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));
    if (folderId) formData.append('folderId', folderId);

    setUploading(true);
    setProgress(0);

    // Initialize queue display
    const queueItems = Array.from(files).map((f) => ({
      name: f.name,
      size: f.size,
      status: 'uploading',
    }));
    setUploadQueue(queueItems);

    const toastId = toast.loading(`Uploading ${files.length} file(s)...`);

    try {
      const { data } = await fileService.uploadFiles(formData, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        setProgress(percent);
      });

      setUploadQueue((prev) => prev.map((item) => ({ ...item, status: 'done' })));
      toast.success(`${data.files.length} file(s) uploaded successfully!`, { id: toastId });
      onSuccess && onSuccess(data.files);
      return data.files;
    } catch (error) {
      setUploadQueue((prev) => prev.map((item) => ({ ...item, status: 'error' })));
      const msg = error.response?.data?.message || 'Upload failed. Please try again.';
      toast.error(msg, { id: toastId });
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
      setTimeout(() => setUploadQueue([]), 3000);
    }
  }, [onSuccess]);

  return { uploadFiles, uploading, progress, uploadQueue };
};
