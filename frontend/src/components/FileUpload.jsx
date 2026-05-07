import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const FileUpload = ({ onUploadSuccess }) => {
  const [uploadQueue, setUploadQueue] = useState([]); // { id, name, progress, status }
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files.length > 3) setIsBulkProcessing(true);

    const formData = new FormData();
    const newUploads = files.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      progress: 0,
      status: 'uploading'
    }));

    setUploadQueue(prev => [...prev, ...newUploads]);

    // Send to backend
    files.forEach(f => formData.append('files', f));

    try {
      await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadQueue(prev => prev.map(item => ({ ...item, progress: percent })));
        }
      });
      
      // Update status to complete
      setUploadQueue(prev => prev.map(item => ({ ...item, status: 'complete' })));
      onUploadSuccess(); // Refresh the document list
      if (files.length > 3) setIsBulkProcessing(false);
    } catch (err) {
      setUploadQueue(prev => prev.map(item => ({ ...item, status: 'failed' })));
    }
  };

  return (
    <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
      <input type="file" multiple accept=".pdf" onChange={handleFileChange} />
      
      {isBulkProcessing && (
        <div className="bg-blue-100 p-3 my-4 rounded">
          Upload in progress — processing {uploadQueue.length} files in background.
        </div>
      )}

      <div className="mt-4 space-y-2">
        {uploadQueue.map(file => (
          <div key={file.id} className="p-2 border rounded">
            <div className="flex justify-between text-sm">
              <span>{file.name} ({file.size})</span>
              <span className={file.status === 'failed' ? 'text-red-500' : 'text-blue-500'}>
                {file.status} {file.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded mt-1">
              <div 
                className="bg-blue-600 h-2 rounded transition-all" 
                style={{ width: `${file.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default FileUpload;