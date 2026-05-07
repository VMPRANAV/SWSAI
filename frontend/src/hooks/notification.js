import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API_BASE_URL, SOCKET_URL } from '../config/api';

const socket = io(SOCKET_URL);

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/notifications`);
    setNotifications(res.data);
    const countRes = await axios.get(`${API_BASE_URL}/api/notifications/unread-count`);
    setUnreadCount(countRes.data.unreadCount);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();

    socket.on('bulk_upload_complete', () => {
      fetchNotifications();
    });

    return () => socket.off('bulk_upload_complete');
  }, []);

  return { notifications, unreadCount, fetchNotifications };
};
