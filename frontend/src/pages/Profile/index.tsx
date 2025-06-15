import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { apiService } from '../../services/api';
import type { User } from '../../types';

interface ProfileData {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  location?: {
    city: string;
    district?: string;
    address?: string;
  };
  isActive?: boolean;
  isVerified?: boolean;
  totalTrades?: number;
  successfulTrades?: number;
  rating?: number;
  totalRatings?: number;
  pendingReviews?: number;
  preferences?: {
    emailNotifications: boolean;
    showLocation: boolean;
    showPhone: boolean;
  };
  lastLoginAt?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt?: string;
  reviews?: Array<{
    _id: string;
    reviewer: {
      _id: string;
      username: string;
      avatar?: string;
    };
    rating: number;
    comment: string;
    tradeOffer: {
      createdAt: string;
    };
    createdAt: string;
  }>;
}

export const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    phone: '',
    city: '',
    district: '',
    address: '',
  });

  const isOwnProfile = !userId || userId === currentUser?._id;

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, [userId, isOwnProfile]);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let data: ProfileData;
      if (isOwnProfile) {
        // Load own profile with full details - API returns user object directly
        const response = await apiService.getProfile();
        // Handle both response.data and direct response formats
        data = (response.data || response) as ProfileData;
      } else {
        // Load public profile - API returns user object directly
        const response = await apiService.getPublicProfile(userId!);
        // Handle both response.data and direct response formats
        data = (response.data || response) as ProfileData;
      }
      
      setProfileData(data);
      
      // Initialize edit form with current data
      if (isOwnProfile) {
        setEditFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          bio: data.bio || '',
          phone: data.phone || '',
          city: data.location?.city || '',
          district: data.location?.district || '',
          address: data.location?.address || '',
        });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems = [
    {
      icon: '👤',
      title: 'Hesap Ayarları',
      items: [
        { name: 'Profil Bilgileri', path: '/profile', active: true }
      ]
    },
    {
      icon: '⭐',
      title: 'Değerlendirmeler',
      items: [
        { name: 'Bekleyen Değerlendirmeler', path: '/reviews/pending' },
        { name: 'Verdiğim Değerlendirmeler', path: '/reviews/given' }
      ]
    },
    {
      icon: '🔒',
      title: 'Gizlilik',
      path: '/profile/privacy'
    },
    {
      icon: '❓',
      title: 'Yardım Merkezi',
      path: '/profile/help'
    },
    {
      icon: '📧',
      title: 'İletişim',
      path: '/profile/contact'
    },
    {
      icon: '🚪',
      title: 'Çıkış Yap',
      action: logout
    }
  ];

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Reset form data when canceling
      setEditFormData({
        firstName: profileData?.firstName || '',
        lastName: profileData?.lastName || '',
        bio: profileData?.bio || '',
        phone: profileData?.phone || '',
        city: profileData?.location?.city || '',
        district: profileData?.location?.district || '',
        address: profileData?.location?.address || '',
      });
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Update profile information
      const profileUpdateData = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        bio: editFormData.bio,
        phone: editFormData.phone,
      };
      
      // Update location information
      const locationUpdateData = {
        city: editFormData.city,
        district: editFormData.district || undefined,
        address: editFormData.address || undefined,
      };
      
      // Update profile first
      await apiService.updateProfile(profileUpdateData);
      
      // Update location if city is provided
      if (editFormData.city) {
        await apiService.updateLocation(locationUpdateData);
      }
      
      // Reload profile data
      await loadProfile();
      setIsEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSuccessRate = () => {
    if (!profileData || !profileData.totalTrades || profileData.totalTrades === 0) return 0;
    return Math.round(((profileData.successfulTrades || 0) / profileData.totalTrades) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profil Yüklenemedi</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-xl mb-4">👤</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profil Bulunamadı</h2>
          <p className="text-gray-600 mb-4">Aradığınız kullanıcı bulunamadı.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex">
            {/* Sidebar - Only show for own profile */}
            {isOwnProfile && (
              <div className="w-80 border-r border-gray-200 p-6">
                {/* User Info */}
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    {profileData.avatar ? (
                      <img 
                        src={profileData.avatar} 
                        alt={profileData.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-blue-600 font-semibold text-lg">
                        {profileData.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Merhaba</div>
                    <div className="font-semibold text-gray-900">{profileData.firstName} {profileData.lastName}</div>
                  </div>
                </div>

                {/* Menu Items */}
                <nav className="space-y-2">
                  {menuItems.map((item, index) => (
                    <div key={index}>
                      {item.items ? (
                        <div>
                          <div className="flex items-center px-3 py-2 text-gray-700 font-medium">
                            <span className="mr-3">{item.icon}</span>
                            {item.title}
                          </div>
                          <div className="ml-6 space-y-1">
                            {item.items.map((subItem, subIndex) => (
                              <Link
                                key={subIndex}
                                to={subItem.path}
                                className={`block px-3 py-2 text-sm rounded-lg ${
                                  location.pathname === subItem.path
                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {subItem.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          {item.action ? (
                            <button
                              onClick={item.action}
                              className="w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                              <span className="mr-3">{item.icon}</span>
                              {item.title}
                            </button>
                          ) : (
                            <Link
                              to={item.path!}
                              className={`flex items-center px-3 py-2 rounded-lg ${
                                location.pathname === item.path
                                  ? 'bg-blue-100 text-blue-700 font-medium'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <span className="mr-3">{item.icon}</span>
                              {item.title}
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 p-8">
              <div className="max-w-4xl">
                {/* Profile Header */}
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mr-6">
                      {profileData.avatar ? (
                        <img 
                          src={profileData.avatar} 
                          alt={profileData.username}
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-blue-600 font-bold text-2xl">
                          {profileData.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {profileData.firstName} {profileData.lastName}
                      </h1>
                      <p className="text-gray-600 mb-2">@{profileData.username}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>📍 {profileData.location?.city || 'Konum belirtilmemiş'}</span>
                        <span>📅 {formatDate(profileData.createdAt)} tarihinde katıldı</span>
                        {profileData.isVerified && (
                          <span className="text-green-600">✅ Doğrulanmış</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isOwnProfile && (
                    <button
                      onClick={handleEditToggle}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      {isEditing ? 'İptal' : 'Profili Düzenle'}
                    </button>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{profileData.totalTrades || 0}</div>
                    <div className="text-sm text-gray-600">Toplam Takas</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{profileData.successfulTrades || 0}</div>
                    <div className="text-sm text-gray-600">Başarılı Takas</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{getSuccessRate()}%</div>
                    <div className="text-sm text-gray-600">Başarı Oranı</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(profileData.rating && profileData.rating > 0) ? profileData.rating.toFixed(1) : '-'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Değerlendirme ({profileData.totalRatings || 0})
                    </div>
                  </div>
                </div>

                {/* Profile Information */}
                {isOwnProfile && isEditing ? (
                  /* Edit Form */
                  <form onSubmit={handleEditSubmit} className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Profil Bilgilerini Düzenle</h2>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            İsim *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={editFormData.firstName}
                            onChange={handleEditChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Soyisim *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={editFormData.lastName}
                            onChange={handleEditChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telefon
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={editFormData.phone}
                          onChange={handleEditChange}
                          placeholder="+90 555 123 4567"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hakkımda
                        </label>
                        <textarea
                          name="bio"
                          value={editFormData.bio}
                          onChange={handleEditChange}
                          rows={4}
                          placeholder="Kendiniz hakkında kısa bir açıklama yazın..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Konum Bilgileri</h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Şehir
                            </label>
                            <input
                              type="text"
                              name="city"
                              value={editFormData.city}
                              onChange={handleEditChange}
                              placeholder="Şehriniz"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              İlçe
                            </label>
                            <input
                              type="text"
                              name="district"
                              value={editFormData.district}
                              onChange={handleEditChange}
                              placeholder="İlçeniz"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Adres
                          </label>
                          <input
                            type="text"
                            name="address"
                            value={editFormData.address}
                            onChange={handleEditChange}
                            placeholder="Detaylı adresiniz"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={handleEditToggle}
                          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                        >
                          Kaydet
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  /* View Mode */
                  <div className="space-y-6">
                    {/* Personal Information */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Kişisel Bilgiler</h2>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">İsim</label>
                          <p className="text-gray-900">{profileData.firstName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Soyisim</label>
                          <p className="text-gray-900">{profileData.lastName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <p className="text-gray-900">{isOwnProfile ? profileData.email : 'Gizli'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                          <p className="text-gray-900">
                            {isOwnProfile ? (profileData.phone || 'Belirtilmemiş') : 'Gizli'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Konum</label>
                          <p className="text-gray-900">
                            {profileData.location?.city || 'Konum belirtilmemiş'}
                            {profileData.location?.district && `, ${profileData.location.district}`}
                            {isOwnProfile && profileData.location?.address && `, ${profileData.location.address}`}
                          </p>
                        </div>
                        {profileData.bio && (
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hakkımda</label>
                            <p className="text-gray-900">{profileData.bio}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reviews Section - Only for public profiles */}
                    {!isOwnProfile && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">
                          Değerlendirmeler
                        </h2>
                        
                        {profileData.reviews && profileData.reviews.length > 0 ? (
                          <div className="space-y-4">
                            {profileData.reviews.map((review) => (
                              <div key={review._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                      {review.reviewer.avatar ? (
                                        <img 
                                          src={review.reviewer.avatar} 
                                          alt={review.reviewer.username}
                                          className="w-8 h-8 rounded-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-gray-600 text-sm">
                                          {review.reviewer.username.charAt(0).toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{review.reviewer.username}</p>
                                      <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                          <span
                                            key={i}
                                            className={`text-sm ${
                                              i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                            }`}
                                          >
                                            ⭐
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {formatDate(review.createdAt)}
                                  </span>
                                </div>
                                <p className="text-gray-700">{review.comment}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-4">
                            Henüz değerlendirme bulunmuyor.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Account Information - Only for own profile */}
                    {isOwnProfile && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Hesap Bilgileri</h2>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hesap Durumu</label>
                            <p className={`font-medium ${(profileData.isActive ?? true) ? 'text-green-600' : 'text-red-600'}`}>
                              {(profileData.isActive ?? true) ? 'Aktif' : 'Pasif'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Doğrulama Durumu</label>
                            <p className={`font-medium ${(profileData.isVerified ?? false) ? 'text-green-600' : 'text-yellow-600'}`}>
                              {(profileData.isVerified ?? false) ? 'Doğrulanmış' : 'Beklemede'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Son Giriş</label>
                            <p className="text-gray-900">
                              {profileData.lastLoginAt ? formatDate(profileData.lastLoginAt) : 'Bilinmiyor'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bekleyen Değerlendirme</label>
                            <p className="text-gray-900">{profileData.pendingReviews || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 