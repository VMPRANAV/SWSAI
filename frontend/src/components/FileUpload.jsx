import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const FileUpload = ({ onUploadSuccess }) => {
  const [uploadQueue, setUploadQueue] = useState([]); // { id, name, size, type, progress, status }
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [maxFilesPerRequest, setMaxFilesPerRequest] = useState(20);
  const inputRef = useRef(null);
  const clearTimerRef = useRef(null);

  const uploadConcurrency = useMemo(() => 3, []);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/upload/config`)
      .then((res) => {
        if (typeof res.data?.maxFilesPerRequest === 'number' && res.data.maxFilesPerRequest > 0) {
          setMaxFilesPerRequest(res.data.maxFilesPerRequest);
        }
      })
      .catch(() => {});

    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / 1024 ** index;
    return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
  };

  const createBatchId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const startUploads = async (selectedFiles) => {
    const files = Array.from(selectedFiles);
    if (files.length === 0) return;

    const isBulk = files.length > 3;
    const batchId = isBulk ? createBatchId() : null;

    setIsBulkProcessing(isBulk);
    setShowDetails(!isBulk);

    const newUploads = files.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: formatBytes(file.size),
      type: file.type || 'application/octet-stream',
      progress: 0,
      status: 'pending',
    }));

    setUploadQueue((prev) => [...prev, ...newUploads]);
    const uploadIds = newUploads.map((u) => u.id);

    const setStatus = (id, status) => {
      setUploadQueue((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    };

    const setProgress = (id, progress) => {
      setUploadQueue((prev) => prev.map((item) => (item.id === id ? { ...item, progress } : item)));
    };

    const uploadSingleFile = async (file, id) => {
      const formData = new FormData();
      formData.append('files', file);
      if (batchId) {
        formData.append('batchId', batchId);
        formData.append('totalFiles', String(files.length));
      }

      setStatus(id, 'uploading');
      setProgress(id, 0);

      await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total ?? 0;
          const percent = total ? Math.round((progressEvent.loaded * 100) / total) : 0;
          setProgress(id, percent);
        },
      });

      setStatus(id, 'complete');
      setProgress(id, 100);
    };

    try {
      // Since we upload per-file (1 file per request), we always satisfy multer's `limits.files`,
      // but still guard against accidental huge fanout.
      if (maxFilesPerRequest <= 0) setMaxFilesPerRequest(20);

      const tasks = files.map((file, index) => ({ file, id: uploadIds[index] }));
      let nextIndex = 0;

      const workers = Array.from({ length: Math.min(uploadConcurrency, tasks.length) }).map(async () => {
        while (nextIndex < tasks.length) {
          const current = nextIndex;
          nextIndex += 1;
          const task = tasks[current];
          await uploadSingleFile(task.file, task.id);
        }
      });

      await Promise.all(workers);

      onUploadSuccess();
      setIsBulkProcessing(false);

      if (inputRef.current) inputRef.current.value = '';
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => setUploadQueue([]), 1200);
    } catch {
      setUploadQueue((prev) =>
        prev.map((item) =>
          uploadIds.includes(item.id) && (item.status === 'pending' || item.status === 'uploading')
            ? { ...item, status: 'failed' }
            : item
        )
      );
      setIsBulkProcessing(false);
    }
  };

  const handleFileChange = async (e) => {
    await startUploads(e.target.files);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []).filter((f) => f.type === 'application/pdf');
    await startUploads(dropped);
  };

  return (
    <div
      className="p-6 border-2 border-dashed border-gray-300 rounded-lg bg-white"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between gap-3">
        <input ref={inputRef} type="file" multiple accept=".pdf" onChange={handleFileChange} />
        {uploadQueue.length > 0 && (
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="text-xs text-blue-600 hover:underline"
          >
            {showDetails ? 'Hide details' : 'Show details'}
          </button>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-500">Drag & drop PDFs here, or choose files.</div>

      {isBulkProcessing && (
        <div className="bg-blue-100 p-3 my-4 rounded">
          Upload in progress — processing {uploadQueue.length} files in background.
        </div>
      )}

      {showDetails && (
        <div className="mt-4 space-y-2">
          {uploadQueue.map((file) => (
            <div key={file.id} className="p-2 border rounded">
              <div className="flex justify-between text-sm">
                <span>
                  {file.name} ({file.size})
                </span>
                <span className={file.status === 'failed' ? 'text-red-500' : 'text-blue-500'}>
                  {file.status} {file.progress}%
                </span>
              </div>
              <div className="text-[11px] text-gray-500 mt-1">{file.type}</div>
              <div className="w-full bg-gray-200 h-2 rounded mt-1">
                <div className="bg-blue-600 h-2 rounded transition-all" style={{ width: `${file.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
