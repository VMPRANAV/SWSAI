import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API_BASE_URL, SOCKET_URL } from '../config/api';

const socket = io(SOCKET_URL);

export const useNotifications = ({ onBulkComplete } = {}) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/notifications`);
    setNotifications(res.data);
    const countRes = await axios.get(`${API_BASE_URL}/api/notifications/unread-count`);
    setUnreadCount(countRes.data.unreadCount);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchNotifications();
    }, 0);

    const handler = (payload) => {
      if (typeof onBulkComplete === 'function') onBulkComplete(payload);
      fetchNotifications();
    };

    socket.on('bulk_upload_complete', handler);

    return () => {
      clearTimeout(t);
      socket.off('bulk_upload_complete', handler);
    };
  }, [onBulkComplete]);

  return { notifications, unreadCount, fetchNotifications };
};
