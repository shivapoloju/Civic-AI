import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [liveUpdate, setLiveUpdate] = useState(null);
  const { user } = useAuth();

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Realtime WS channel connected.');
      newSocket.emit('join', user.id);
    });

    // Listen for custom broadcast events
    newSocket.on('notification', (data) => {
      setLiveUpdate({ type: 'NOTIFICATION', data });
      showBrowserNotification(data.title, data.message);
    });

    newSocket.on('complaint_status_change', (data) => {
      setLiveUpdate({ type: 'STATUS_CHANGE', data });
    });

    newSocket.on('new_complaint', (data) => {
      setLiveUpdate({ type: 'NEW_COMPLAINT', data });
    });

    newSocket.on('worker_location_update', (data) => {
      setLiveUpdate({ type: 'WORKER_GPS', data });
    });

    // Request browser notification permissions
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const showBrowserNotification = (title, message) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico'
      });
    }
  };

  const clearLiveUpdate = () => setLiveUpdate(null);

  return (
    <SocketContext.Provider value={{ socket, liveUpdate, clearLiveUpdate }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
