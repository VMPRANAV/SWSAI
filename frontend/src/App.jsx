import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import { useNotifications } from './hooks/notification';
import { API_BASE_URL } from './config/api';

function App() {
  const [files, setFiles] = useState([]);
  const { notifications, unreadCount, fetchNotifications } = useNotifications();

  const fetchFiles = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/files`);
    setFiles(res.data);
  };

  const handleMarkAllRead = async () => {
    await axios.patch(`${API_BASE_URL}/api/notifications/read-all`);
    fetchNotifications();
  };

  useEffect(() => { fetchFiles(); }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        unreadCount={unreadCount} 
        notifications={notifications} 
        onMarkAllRead={handleMarkAllRead} 
      />
      
      <main className="max-w-4xl mx-auto p-8">
        <FileUpload onUploadSuccess={fetchFiles} />

        <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Size</th>
                <th className="p-4">Date</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr key={file._id} className="border-t">
                  <td className="p-4">{file.originalName}</td>
                  <td className="p-4">{(file.size / 1024).toFixed(2)} KB</td>
                  <td className="p-4">{new Date(file.uploadDate).toLocaleDateString()}</td>
                  <td className="p-4">
                    <a href={`${API_BASE_URL}/${file.path}`} download className="text-blue-600">Download</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default App;