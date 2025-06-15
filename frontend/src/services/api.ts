const API_BASE_URL = 'http://167.99.210.227:3000/api';

// API Response types
interface ApiResponse<T = any> {
  message: string;
  data?: T;
}

// Request interceptor for adding auth token
const makeRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      
      // Only redirect to login if we're not already on a public page
      const currentPath = window.location.pathname;
      const publicPaths = ['/', '/login', '/register'];
      const isListingDetail = currentPath.startsWith('/listing/');
      
      if (!publicPaths.includes(currentPath) && !isListingDetail) {
        window.location.href = '/login';
      }
      
      throw new Error('Authentication required');
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// File upload helper
const uploadFile = async (endpoint: string, formData: FormData): Promise<{message: string; filename: string; imageUrl: string}> => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Authentication required');
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }

    // Backend direkt {message, filename, url} döndürüyor
    return data;
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
};

export const apiService = {
  // 🔐 Authentication
  register: async (userData: {
    username: string;
    email: string;
    password: string;
  }) => {
    return makeRequest('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials: {
    email: string;
    password: string;
  }) => {
    // Login endpoint özel handling - backend direkt {token, user} döndürüyor
    const token = localStorage.getItem('token');
    
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(credentials),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, config);
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Authentication required');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Backend direkt {token, user} döndürüyor
      return data;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  },

  // 👤 User Profile
  getProfile: async () => {
    return makeRequest('/users/profile');
  },

  getPublicProfile: async (userId: string) => {
    return makeRequest(`/users/profile/${userId}`);
  },

  updateProfile: async (profileData: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    phone?: string;
  }) => {
    return makeRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  updateAvatar: async (avatar: string) => {
    return makeRequest('/users/profile/avatar', {
      method: 'PUT',
      body: JSON.stringify({ avatar }),
    });
  },

  updateLocation: async (locationData: {
    city: string;
    district?: string;
    address?: string;
  }) => {
    return makeRequest('/users/profile/location', {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
  },

  // 📖 Listings
  getListings: async (params?: {
    category?: string;
    city?: string;
    condition?: string;
    author?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = value.toString();
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    return makeRequest(`/listings${queryString}`);
  },

  getMyListings: async () => {
    return makeRequest('/listings/my');
  },

  createListing: async (listingData: {
    bookTitle: string;
    author: string;
    isbn?: string;
    category: string;
    condition: 'yeni' | 'çok_iyi' | 'iyi' | 'orta' | 'kötü';
    images: string[];
    description: string;
    publisher?: string;
    publishedYear?: number;
    language?: string;
    wantedCategories?: string[];
    wantedAuthors?: string[];
    notes?: string;
    location: {
      city: string;
      district?: string;
    };
    shippingAvailable?: boolean;
  }) => {
    return makeRequest('/listings', {
      method: 'POST',
      body: JSON.stringify(listingData),
    });
  },

  getListingDetails: async (id: string) => {
    return makeRequest(`/listings/${id}`);
  },

  updateListing: async (id: string, listingData: any) => {
    return makeRequest(`/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(listingData),
    });
  },

  deleteListing: async (id: string) => {
    return makeRequest(`/listings/${id}`, {
      method: 'DELETE',
    });
  },

  archiveListing: async (id: string) => {
    return makeRequest(`/listings/${id}/archive`, {
      method: 'PUT',
    });
  },

  // 🤝 Trade Offers
  getReceivedOffers: async () => {
    return makeRequest('/offers/received');
  },

  getSentOffers: async () => {
    return makeRequest('/offers/sent');
  },

  createOffer: async (offerData: {
    targetListing: string;
    bookTitle: string;
    author: string;
    category: string;
    condition: 'yeni' | 'çok_iyi' | 'iyi' | 'orta' | 'kötü';
    images: string[];
    description: string;
  }) => {
    // Backend'in beklediği format
    const requestBody = {
      targetListingId: offerData.targetListing,
      offeredBook: {
        bookTitle: offerData.bookTitle,
        author: offerData.author,
        category: offerData.category,
        condition: offerData.condition,
        images: offerData.images,
        description: offerData.description,
      }
    };
    
    return makeRequest('/offers', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  },

  getOfferDetails: async (id: string) => {
    return makeRequest(`/offers/${id}`);
  },

  acceptChat: async (offerId: string) => {
    return makeRequest(`/offers/${offerId}/accept-chat`, {
      method: 'PUT',
    });
  },

  acceptOffer: async (offerId: string) => {
    return makeRequest(`/offers/${offerId}/accept-offer`, {
      method: 'PUT',
    });
  },

  rejectOffer: async (offerId: string) => {
    return makeRequest(`/offers/${offerId}/reject`, {
      method: 'PUT',
    });
  },

  cancelOffer: async (offerId: string) => {
    return makeRequest(`/offers/${offerId}/cancel`, {
      method: 'PUT',
    });
  },

  // 💬 Conversations & Messages
  getConversations: async () => {
    // Bu endpoint direkt array döndürüyor, ApiResponse wrapper yok
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load conversations');
      }

      // Backend direkt array döndürüyor
      return data;
    } catch (error) {
      console.error('Conversations Error:', error);
      throw error;
    }
  },

  getMessages: async (conversationId: string) => {
    // Bu endpoint {conversation: {...}, messages: [...]} formatında döndürüyor
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load messages');
      }

      // Backend {conversation: {...}, messages: [...]} döndürüyor
      return data;
    } catch (error) {
      console.error('Messages Error:', error);
      throw error;
    }
  },

  sendMessage: async (conversationId: string, content: string) => {
    // Bu endpoint direkt message object döndürüyor
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ content }),
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      // Backend direkt message object döndürüyor
      return data;
    } catch (error) {
      console.error('Send Message Error:', error);
      throw error;
    }
  },

  markMessagesRead: async (conversationId: string) => {
    return makeRequest(`/conversations/${conversationId}/messages/read`, {
      method: 'PUT',
    });
  },

  // ⭐ Reviews
  getPendingReviews: async () => {
    return makeRequest('/reviews/pending');
  },

  createReview: async (reviewData: {
    tradeOfferId: string;
    revieweeId: string;
    rating: number;
    comment?: string;
  }) => {
    return makeRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  getReceivedReviews: async (params?: {
    page?: number;
    limit?: number;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = value.toString();
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    return makeRequest(`/reviews/received${queryString}`);
  },

  getGivenReviews: async (params?: {
    page?: number;
    limit?: number;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = value.toString();
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    return makeRequest(`/reviews/given${queryString}`);
  },

  getUserPublicReviews: async (userId: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = value.toString();
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    return makeRequest(`/users/${userId}/reviews${queryString}`);
  },

  // 📁 File Upload
  uploadSingle: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return uploadFile('/upload/single', formData);
  },

  uploadMultiple: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    return uploadFile('/upload/multiple', formData);
  },

  // 🔔 Notifications
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) => {
    // Bu endpoint özel response formatı döndürüyor
    const token = localStorage.getItem('token');
    
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = value.toString();
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    try {
      const response = await fetch(`${API_BASE_URL}/notifications${queryString}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load notifications');
      }

      // Backend direkt {notifications: [...], pagination: {...}, unreadCount: number} döndürüyor
      return data;
    } catch (error) {
      console.error('Notifications Error:', error);
      throw error;
    }
  },

  getUnreadCount: async () => {
    // Bu endpoint özel response formatı döndürüyor
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load unread count');
      }

      // Backend direkt {unreadCount: number} döndürüyor
      return data;
    } catch (error) {
      console.error('Unread Count Error:', error);
      throw error;
    }
  },

  markNotificationsRead: async (notificationIds: string[]) => {
    return makeRequest('/notifications/mark-read', {
      method: 'PUT',
      body: JSON.stringify({ notificationIds }),
    });
  },

  markAllNotificationsRead: async () => {
    return makeRequest('/notifications/mark-all-read', {
      method: 'PUT',
    });
  },
}; 