import { useState, useEffect, useCallback, useRef } from 'react';
import { fileService } from '../services/fileService';
import toast from 'react-hot-toast';

export const useFiles = (initialParams = {}) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [params, setParams] = useState({ page: 1, limit: 20, ...initialParams });
  const abortRef = useRef(null);

  const fetchFiles = useCallback(async (queryParams = params) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const { data } = await fileService.getFiles(queryParams);
      setFiles(data.files || []);
      setPagination(data.pagination || null);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError(err.message || 'Failed to load files');
      }
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchFiles(params);
  }, [params]);

  const updateParams = useCallback((newParams) => {
    setParams((prev) => ({ ...prev, ...newParams, page: 1 }));
  }, []);

  const deleteFile = useCallback(async (id) => {
    try {
      await fileService.deleteFile(id);
      setFiles((prev) => prev.filter((f) => f._id !== id));
      toast.success('File moved to trash.');
    } catch (err) {
      toast.error(err.message || 'Delete failed.');
    }
  }, []);

  const toggleFavorite = useCallback(async (id) => {
    try {
      const { data } = await fileService.toggleFavorite(id);
      setFiles((prev) =>
        prev.map((f) => (f._id === id ? { ...f, isFavorite: data.isFavorite } : f))
      );
      toast.success(data.message);
    } catch {
      toast.error('Failed to update favorite.');
    }
  }, []);

  const renameFile = useCallback(async (id, name) => {
    try {
      const { data } = await fileService.updateFile(id, { name });
      setFiles((prev) => prev.map((f) => (f._id === id ? data.file : f)));
      toast.success('File renamed.');
    } catch {
      toast.error('Failed to rename file.');
    }
  }, []);

  const addFiles = useCallback((newFiles) => {
    setFiles((prev) => [...newFiles, ...prev]);
  }, []);

  return {
    files, loading, error, pagination, params,
    fetchFiles, updateParams, deleteFile, toggleFavorite, renameFile, addFiles,
  };
};
