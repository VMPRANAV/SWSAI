import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const FileUpload = ({ onUploadSuccess, onUploadStart }) => {
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [maxFilesPerRequest, setMaxFilesPerRequest] = useState(20);
  const [isDragging, setIsDragging] = useState(false);
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
    if (typeof onUploadStart === 'function') onUploadStart(files.length, isBulk);

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

      if (typeof onUploadSuccess === 'function') onUploadSuccess();
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
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files || []).filter((f) => f.type === 'application/pdf');
    await startUploads(dropped);
  };

  return (
    <div
      className={`p-6 border-2 border-dashed rounded-2xl bg-white shadow-sm transition duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        isDragging ? 'border-blue-400 bg-blue-50/40' : 'border-blue-200'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 text-blue-700 grid place-items-center">
            <span className="font-bold text-xs tracking-wide">PDF</span>
          </div>
          <div>
            <div className="font-bold text-slate-900">Upload PDFs</div>
            <div className="text-xs text-slate-500">Choose files or drag & drop into this box.</div>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf"
          onChange={handleFileChange}
          className="text-sm"
        />
        {uploadQueue.length > 0 && (
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="text-xs text-blue-700 hover:underline font-semibold active:scale-[0.98] transition"
          >
            {showDetails ? 'Hide details' : 'Show details'}
          </button>
        )}
      </div>

      {isBulkProcessing && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-blue-800">
          <div className="font-semibold">Upload in progress</div>
          <div className="text-sm">Processing {uploadQueue.length} files in background.</div>
        </div>        
      )}

      {showDetails && (
        <div className="mt-4 space-y-2">
          {uploadQueue.map((file) => (
            <div key={file.id} className="p-3 border border-slate-200 rounded-xl bg-white">
              <div className="flex justify-between text-sm">
                <span>
                  {file.name} ({file.size})
                </span>
                <span
                  className={`inline-flex items-center gap-2 ${
                    file.status === 'failed' ? 'text-red-600' : file.status === 'complete' ? 'text-emerald-700' : 'text-blue-700'
                  }`}
                >
                  <span className="text-xs font-semibold capitalize">{file.status}</span>
                  <span className="tabular-nums">{file.progress}%</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{file.type}</div>
              <div className="w-full bg-slate-100 h-2 rounded mt-2 overflow-hidden">
                <div
                  className={`h-2 rounded transition-[width] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                    file.status === 'failed' ? 'bg-red-500' : file.status === 'complete' ? 'bg-emerald-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
