import { create } from 'zustand';
import { apiService } from '../services/api';
import type { Notification, NotificationState } from '../types';

interface NotificationStore extends NotificationState {
  // Notification operations
  loadNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  markNotificationsRead: (notificationIds: string[]) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  
  // UI helpers
  clearError: () => void;
  addNotification: (notification: Notification) => void;
  
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  setPagination: (pagination: { page: number; limit: number; total: number; pages: number }) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },

  loadNotifications: async (params = { page: 1, limit: 20, unreadOnly: false }) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getNotifications(params);
      
      // API response formatına göre güncelle
      const notificationsData = response.notifications || [];
      const paginationData = response.pagination || { page: 1, limit: 20, total: 0, pages: 0 };
      const unreadCountData = response.unreadCount || 0;
      
      set({
        notifications: notificationsData as Notification[],
        unreadCount: unreadCountData,
        pagination: paginationData,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load notifications',
      });
    }
  },

  loadUnreadCount: async () => {
    try {
      const response = await apiService.getUnreadCount();
      
      // API response: { unreadCount: number }
      const unreadCount = response.unreadCount || 0;
      
      set({ unreadCount });
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  },

  markNotificationsRead: async (notificationIds: string[]) => {
    try {
      await apiService.markNotificationsRead(notificationIds);
      
      // Update local state
      set((state) => ({
        notifications: state.notifications.map(notification =>
          notificationIds.includes(notification._id)
            ? { ...notification, isRead: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - notificationIds.length),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to mark notifications as read',
      });
      throw error;
    }
  },

  markAllNotificationsRead: async () => {
    try {
      await apiService.markAllNotificationsRead();
      
      // Update local state
      set((state) => ({
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true,
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
      });
      throw error;
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
    }));
  },

  setPagination: (pagination) => {
    set({ pagination });
  },

  clearError: () => {
    set({ error: null });
  },
})); 