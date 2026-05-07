import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000');

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    const res = await axios.get('http://localhost:5000/api/notifications');
    setNotifications(res.data);
    const countRes = await axios.get('http://localhost:5000/api/notifications/unread-count');
    setUnreadCount(countRes.data.unreadCount);
  };

  useEffect(() => {
    fetchNotifications();

    socket.on('bulk_upload_complete', (notif) => {
    
      alert(notif.message); 
      fetchNotifications();
    });

    return () => socket.off('bulk_upload_complete');
  }, []);

  return { notifications, unreadCount, fetchNotifications };
};