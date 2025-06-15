// 👤 User Types
export interface User {
  _id: string; // Backend'de _id kullanılıyor
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
  avatar?: string;
  location?: {
    city: string;
    district?: string;
    address?: string;
  };
  rating?: number;
  totalRatings?: number;
  totalTrades?: number;
  successfulTrades?: number;
  createdAt: string;
}

// 🔐 Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  city: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
}

// 📖 Listing Types
export interface BookListing {
  _id: string;
  user: string | User;
  owner?: {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  bookTitle: string;
  author: string;
  isbn?: string;
  category: string;
  condition: 'yeni' | 'çok_iyi' | 'iyi' | 'orta' | 'kötü';
  images: string[];
  description: string;
  publisher?: string;
  publishedYear?: number;
  language: string;
  wantedCategories?: string[];
  wantedAuthors?: string[];
  notes?: string;
  location: {
    city: string;
    district?: string;
  };
  shippingAvailable: boolean;
  status: 'active' | 'pending' | 'completed' | 'removed';
  viewCount: number;
  favoriteCount: number;
  offerCount: number;
  completedTradeOffer?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
  // Frontend için ek alanlar
  bookImage?: string; // Backward compatibility
}

export interface CreateListingData {
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
}

export interface UpdateListingData extends Partial<CreateListingData> {}

// 🤝 Trade Offer Types
export interface TradeOffer {
  _id: string;
  fromUser: string | User;
  toUser: string | User;
  targetListing: string | BookListing;
  bookTitle: string;
  author: string;
  category: string;
  condition: 'yeni' | 'çok_iyi' | 'iyi' | 'orta' | 'kötü';
  images: string[];
  description: string;
  status: 'pending' | 'chat_accepted' | 'accepted' | 'rejected' | 'cancelled';
  chatAcceptedDate?: string;
  responseDate?: string;
  completedDate?: string;
  conversation?: string;
  fromUserReviewed: boolean;
  toUserReviewed: boolean;
  bothReviewed: boolean;
  createdAt: string;
}

export interface CreateOfferData {
  targetListing: string;
  bookTitle: string;
  author: string;
  category: string;
  condition: 'yeni' | 'çok_iyi' | 'iyi' | 'orta' | 'kötü';
  images: string[];
  description: string;
}

// 💬 Conversation & Message Types
export interface Conversation {
  _id: string;
  participants: User[]; // API'de her zaman User object olarak geliyor
  listing: {
    _id: string;
    bookTitle: string;
    author: string;
  };
  tradeOffer: {
    _id: string;
    status: 'pending' | 'chat_accepted' | 'accepted' | 'rejected' | 'cancelled';
    offeredBook: {
      bookTitle: string;
      author: string;
    };
  };
  status: 'active' | 'ended';
  lastMessageAt?: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User; // API'de her zaman User object olarak geliyor
  content: string;
  messageType: 'text' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface CreateMessageData {
  content: string;
}

export interface CreateConversationData {
  participants: string[];
  tradeOffer?: string;
}

// ⭐ Review Types
export interface Review {
  _id: string;
  tradeOffer: {
    _id: string;
    targetListing: {
      _id: string;
      bookTitle: string;
      author: string;
      images?: string[];
    };
    offeredBook: {
      bookTitle: string;
      author: string;
    };
    fromUser: {
      _id: string;
      username: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    toUser: {
      _id: string;
      username: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  reviewer: string;
  reviewee: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  rating?: number;
  comment?: string;
  isRequired?: boolean;
  reminderCount?: number;
  isVisible?: boolean;
  createdAt: string;
}

export interface CreateReviewData {
  tradeOfferId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// 🔔 Notification Types
export interface Notification {
  _id: string;
  user: string | User;
  type: 'new_offer' | 'offer_chat_accepted' | 'offer_accepted' | 'offer_rejected' | 'offer_cancelled' | 'new_message' | 'conversation_ended' | 'review_required' | 'review_received' | 'listing_created';
  title: string;
  message: string;
  data: any; // Ek bilgiler (offerId, listingId, etc.)
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

// 📁 File Upload Types
export interface UploadResponse {
  message: string;
  filename: string;
  url: string;
}

export interface MultipleUploadResponse {
  message: string;
  files: {
    filename: string;
    url: string;
  }[];
}

// 📊 API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// 🎯 Frontend Specific Types
export interface FilterOptions {
  category?: string;
  city?: string;
  condition?: string;
  author?: string;
  page?: number;
  limit?: number;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  author?: string;
  condition?: string;
  city?: string;
  minYear?: number;
  maxYear?: number;
}

// 📱 UI State Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// 🔄 Store Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface BookState {
  listings: BookListing[];
  myListings: BookListing[];
  currentListing: BookListing | null;
  isLoading: boolean;
  error: string | null;
  filters: SearchFilters;
  pagination: PaginationState;
}

export interface ConversationState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface OfferState {
  receivedOffers: TradeOffer[];
  sentOffers: TradeOffer[];
  currentOffer: TradeOffer | null;
  isLoading: boolean;
  error: string | null;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

export interface ReviewState {
  pendingReviews: Review[];
  givenReviews: Review[];
  receivedReviews: Review[];
  isLoading: boolean;
  error: string | null;
} 