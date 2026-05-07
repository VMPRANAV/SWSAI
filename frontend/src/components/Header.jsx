import React, { useState } from 'react';
import { Bell } from 'lucide-react';

const Header = ({ unreadCount, notifications, onMarkAllRead, onMarkRead }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="flex justify-between items-center p-4 bg-gray-800 text-white relative shadow-md">
      <h1 className="text-xl font-bold">PDF Manager</h1>
      
      <div className="relative">
        <button 
          className="relative p-2 hover:bg-gray-700 rounded-full transition"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell size={24} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        
        {isOpen && (
          <div className="absolute right-0 mt-3 w-80 bg-white text-black shadow-2xl rounded-lg z-50 border border-gray-200">
            <div className="p-3 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
              <span className="font-bold text-gray-700">Notifications</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAllRead();
                }} 
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Mark all read
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400 italic">No new notifications</div>
              ) : (
                notifications.map(n => (
                  <button
                    key={n._id}
                    type="button"
                    onClick={async () => {
                      if (!n.isRead) await onMarkRead(n._id);
                    }}
                    className={`w-full text-left p-4 border-b hover:bg-gray-50 transition ${!n.isRead ? 'bg-blue-50' : ''}`}
                  >
                    <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                      {n.message}
                    </p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {new Date(n.timestamp).toLocaleString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
