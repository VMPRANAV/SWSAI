import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import { useNotifications } from './hooks/notification';
import { API_BASE_URL } from './config/api';
import { Trash2 } from 'lucide-react';

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

  const handleMarkRead = async (id) => {
    await axios.patch(`${API_BASE_URL}/api/notifications/${id}/read`);
    fetchNotifications();
  };

  const handleDeleteFile = async (id) => {
    await axios.delete(`${API_BASE_URL}/api/files/${id}`);
    await fetchFiles();
    fetchNotifications();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFiles();
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_circle_at_20%_0%,rgba(37,99,235,0.10),transparent_55%),radial-gradient(900px_circle_at_80%_10%,rgba(37,99,235,0.08),transparent_50%)]">
      <Header 
        unreadCount={unreadCount} 
        notifications={notifications} 
        onMarkAllRead={handleMarkAllRead} 
        onMarkRead={handleMarkRead}
      />
      
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">PDF Manager</h1>
            <p className="text-slate-500 mt-1">Upload PDFs, track progress, and download stored documents.</p>
          </div>
        </div>
        <FileUpload onUploadSuccess={fetchFiles} />

        <div className="mt-8 bg-white shadow-sm rounded-2xl overflow-hidden border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Documents</h2>
            <div className="text-sm text-slate-500">{files.length} file(s)</div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Size</th>
                <th className="p-4">Date</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr key={file._id} className="border-t border-slate-100">
                  <td className="p-4 text-slate-900 font-medium">{file.originalName}</td>
                  <td className="p-4 text-slate-600">{(file.size / 1024).toFixed(2)} KB</td>
                  <td className="p-4 text-slate-600">{new Date(file.uploadDate).toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <a
                        href={`${API_BASE_URL}/${file.path}`}
                        download
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-sm"
                      >
                        Download
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`Delete "${file.originalName}"?`)) await handleDeleteFile(file._id);
                        }}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                        aria-label={`Delete ${file.originalName}`}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
