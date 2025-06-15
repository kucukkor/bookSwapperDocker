import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store';
import type { Notification } from '../../types';

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    pagination,
    loadNotifications,
    loadUnreadCount,
    markNotificationsRead,
    markAllNotificationsRead,
    clearError,
  } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showPushNotificationBanner, setShowPushNotificationBanner] = useState(true);

  // Load notifications on mount and tab change
  useEffect(() => {
    const params = {
      page: 1,
      limit: 20,
      unreadOnly: activeTab === 'unread',
    };
    loadNotifications(params);
    loadUnreadCount();
  }, [activeTab, loadNotifications, loadUnreadCount]);

  // Filter notifications based on active tab
  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const handleTabChange = (tab: 'all' | 'unread') => {
    setActiveTab(tab);
    setSelectedNotifications([]);
  };

  const handleNotificationClick = useCallback(async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      try {
        await markNotificationsRead([notification._id]);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'new_offer':
        navigate('/my-listings');
        break;
      case 'offer_chat_accepted':
      case 'new_message':
        if (notification.data?.conversationId) {
          navigate(`/messages/${notification.data.conversationId}`);
        } else {
          navigate('/messages');
        }
        break;
      case 'offer_accepted':
      case 'offer_rejected':
      case 'offer_cancelled':
        navigate('/my-listings');
        break;
      case 'review_required':
        navigate('/reviews/pending');
        break;
      case 'review_received':
        navigate('/profile');
        break;
      case 'listing_created':
        if (notification.data?.listingId) {
          navigate(`/listing/${notification.data.listingId}`);
        } else {
          navigate('/my-listings');
        }
        break;
      default:
        // Do nothing for unknown types
        break;
    }
  }, [markNotificationsRead, navigate]);

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    const unreadNotificationIds = filteredNotifications
      .filter(n => !n.isRead)
      .map(n => n._id);
    
    setSelectedNotifications(
      selectedNotifications.length === unreadNotificationIds.length
        ? []
        : unreadNotificationIds
    );
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      await markNotificationsRead(selectedNotifications);
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Failed to mark selected notifications as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_offer':
        return '📝';
      case 'offer_chat_accepted':
        return '💬';
      case 'offer_accepted':
        return '✅';
      case 'offer_rejected':
        return '❌';
      case 'offer_cancelled':
        return '🚫';
      case 'new_message':
        return '💬';
      case 'conversation_ended':
        return '🔚';
      case 'review_required':
        return '⭐';
      case 'review_received':
        return '🌟';
      case 'listing_created':
        return '📚';
      default:
        return '🔔';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} dakika önce`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} saat önce`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} gün önce`;
    }
  };

  const loadMoreNotifications = () => {
    if (pagination.page < pagination.pages) {
      const params = {
        page: pagination.page + 1,
        limit: 20,
        unreadOnly: activeTab === 'unread',
      };
      loadNotifications(params);
    }
  };

  if (error) {
    clearError();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Push Notification Banner */}
        {showPushNotificationBanner && (
          <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-amber-500 mr-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700">
                <strong>Anlık bildirimleri açın</strong> - Yeni teklifler ve mesajlardan hemen haberdar olun
              </span>
            </div>
            <div className="flex gap-2">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Bildirimleri Aç
              </button>
              <button 
                onClick={() => setShowPushNotificationBanner(false)}
                className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Kapat
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bildirimler</h1>
            {unreadCount > 0 && (
              <p className="text-gray-600 mt-1">
                {unreadCount} okunmamış bildirim
              </p>
            )}
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Tümünü Okundu İşaretle
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-6 py-3 rounded-lg font-medium ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Tümü ({notifications.length})
          </button>
          <button
            onClick={() => handleTabChange('unread')}
            className={`px-6 py-3 rounded-lg font-medium ${
              activeTab === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Okunmamış ({unreadCount})
          </button>
        </div>

        {/* Bulk Actions */}
        {filteredNotifications.some(n => !n.isRead) && (
          <div className="bg-white rounded-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedNotifications.length === filteredNotifications.filter(n => !n.isRead).length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Tümünü Seç</span>
              </label>
              {selectedNotifications.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedNotifications.length} bildirim seçildi
                </span>
              )}
            </div>
            
            {selectedNotifications.length > 0 && (
              <button
                onClick={handleMarkSelectedAsRead}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Seçilenleri Okundu İşaretle
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && notifications.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Bildirimler yükleniyor...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm">
          {filteredNotifications.length === 0 && !isLoading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-lg font-medium mb-2">
                {activeTab === 'unread' ? 'Okunmamış bildirim yok' : 'Henüz bildirim yok'}
              </h3>
              <p>
                {activeTab === 'unread' 
                  ? 'Tüm bildirimlerinizi okumuşsunuz.'
                  : 'Bildirimleriniz geldiğinde burada görünecek.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification._id} 
                  className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start">
                    {/* Checkbox for unread notifications */}
                    {!notification.isRead && (
                      <div className="flex-shrink-0 mr-3 pt-1">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification._id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectNotification(notification._id);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Icon */}
                    <div className="flex-shrink-0 mr-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        notification.priority === 'high' ? 'bg-red-100' :
                        notification.priority === 'medium' ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{formatTime(notification.createdAt)}</span>
                            <span className={`font-medium ${getPriorityColor(notification.priority)}`}>
                              {notification.priority === 'high' ? 'Yüksek' :
                               notification.priority === 'medium' ? 'Orta' : 'Düşük'} öncelik
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More Button */}
        {pagination.page < pagination.pages && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMoreNotifications}
              disabled={isLoading}
              className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg border border-gray-200 font-medium disabled:opacity-50"
            >
              {isLoading ? 'Yükleniyor...' : 'Daha Fazla Göster'}
            </button>
          </div>
        )}

        {/* Pagination Info */}
        {pagination.total > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            {pagination.total} bildirimden {Math.min(pagination.page * pagination.limit, pagination.total)} tanesi gösteriliyor
          </div>
        )}
      </div>
    </div>
  );
}; 