import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socketUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '/');

    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join:user', user._id);
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, user?._id]);

  const joinComplaint = useCallback((complaintId) => {
    socketRef.current?.emit('join:complaint', complaintId);
  }, []);

  const leaveComplaint = useCallback((complaintId) => {
    socketRef.current?.emit('leave:complaint', complaintId);
  }, []);

  const onEvent = useCallback((event, callback) => {
    socketRef.current?.on(event, callback);
    return () => socketRef.current?.off(event, callback);
  }, []);

  const emitTyping = useCallback((complaintId, isTyping) => {
    if (socketRef.current && user) {
      const event = isTyping ? 'typing:start' : 'typing:stop';
      socketRef.current.emit(event, { complaintId, userId: user._id, userName: user.name });
    }
  }, [user]);

  const value = {
    socket: socketRef.current,
    connected,
    joinComplaint,
    leaveComplaint,
    onEvent,
    emitTyping,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
