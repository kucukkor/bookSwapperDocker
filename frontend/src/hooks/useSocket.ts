import { useEffect, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuthStore, useNotificationStore } from '../store';

interface Message {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  messageType: 'user' | 'system';
  isRead: boolean;
  createdAt: string;
}

interface Notification {
  _id: string;
  user: string;
  type: 'new_offer' | 'offer_chat_accepted' | 'offer_accepted' | 'offer_rejected' | 'offer_cancelled' | 'new_message' | 'conversation_ended' | 'review_required' | 'review_received' | 'listing_created';
  title: string;
  message: string;
  data: any;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  isRead: boolean;
}

interface ConversationEndedData {
  conversationId: string;
  reason: 'offer_accepted' | 'offer_rejected';
  endedAt: string;
}

interface MessageReadData {
  messageId: string;
  conversationId: string;
  readBy: string;
}

interface SocketError {
  message: string;
  code: string;
}

const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { token, logout } = useAuthStore();
  const { addNotification, loadUnreadCount } = useNotificationStore();

  // Initialize socket connection
  useEffect(() => {
    if (!token) {
      // No token, disconnect if connected
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io('http://167.99.210.227:3000', {
      auth: {
        token
      }
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      
      // If auth error, logout user
      if (error.message.includes('Authentication')) {
        logout();
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Message events
    newSocket.on('newMessage', (message: Message) => {
      console.log('New message received:', message);
      setMessages(prev => [...prev, message]);
      
      // You can add toast notification here
      // toast.info(`New message from ${message.sender.username}`);
    });

    // Notification events
    newSocket.on('newNotification', (notification: Notification) => {
      console.log('New notification received:', notification);
      setNotifications(prev => [notification, ...prev]);
      
      // Add to notification store
      addNotification(notification);
      
      // Update unread count
      loadUnreadCount();
      
      // You can add toast notification here based on priority
      // if (notification.priority === 'high') {
      //   toast.success(notification.title);
      // }
    });

    // Message read events
    newSocket.on('messageRead', (data: MessageReadData) => {
      console.log('Message read:', data);
      setMessages(prev => 
        prev.map(msg => 
          msg._id === data.messageId 
            ? { ...msg, isRead: true }
            : msg
        )
      );
    });

    // Conversation ended events
    newSocket.on('conversationEnded', (data: ConversationEndedData) => {
      console.log('Conversation ended:', data);
      
      // You can show a notification or redirect user
      // toast.info(`Conversation ended: ${data.reason}`);
    });

    // Error events
    newSocket.on('error', (error: SocketError) => {
      console.error('Socket error:', error);
      
      // You can show error toast
      // toast.error(error.message);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [token, logout, addNotification, loadUnreadCount]);

  // Join conversation
  const joinConversation = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      console.log('Joining conversation:', conversationId);
      socket.emit('joinConversation', conversationId);
    }
  }, [socket, isConnected]);

  // Leave conversation
  const leaveConversation = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      console.log('Leaving conversation:', conversationId);
      socket.emit('leaveConversation', conversationId);
    }
  }, [socket, isConnected]);

  // Send message
  const sendMessage = useCallback((conversationId: string, content: string) => {
    if (socket && isConnected) {
      console.log('Sending message:', { conversationId, content });
      socket.emit('sendMessage', {
        conversationId,
        content,
        messageType: 'user'
      });
    }
  }, [socket, isConnected]);

  // Clear messages (useful when switching conversations)
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get unread message count for a conversation
  const getUnreadCount = useCallback((conversationId: string) => {
    return messages.filter(msg => 
      msg.conversation === conversationId && !msg.isRead
    ).length;
  }, [messages]);

  // Get total unread notifications count
  const getUnreadNotificationCount = useCallback(() => {
    return notifications.length; // Assuming new notifications are unread
  }, [notifications]);

  return {
    socket,
    isConnected,
    messages,
    notifications,
    joinConversation,
    leaveConversation,
    sendMessage,
    clearMessages,
    clearNotifications,
    getUnreadCount,
    getUnreadNotificationCount,
  };
};

export default useSocket; 