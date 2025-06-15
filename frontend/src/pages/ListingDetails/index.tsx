import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { apiService } from '../../services/api';
import { SendOfferModal } from '../../components';
import type { BookListing, CreateOfferData } from '../../types';

export const ListingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { isAuthenticated, user } = useAuthStore();
  
  const [currentListing, setCurrentListing] = useState<BookListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadListingDetails(id);
    }
  }, [id]);

  const loadListingDetails = async (listingId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getListingDetails(listingId);
      // Handle both response.data and direct response formats
      const listingData = (response.data || response) as BookListing;
      console.log('Listing data from API:', listingData);
      console.log('User data:', listingData.user);
      setCurrentListing(listingData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Kitap detayları yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOffer = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowOfferModal(true);
  };

  const handleOfferSubmit = async (offerData: CreateOfferData) => {
    if (!currentListing) return;
    
    try {
      await apiService.createOffer({
        targetListing: currentListing._id,
        bookTitle: offerData.bookTitle,
        author: offerData.author,
        category: offerData.category,
        condition: offerData.condition,
        images: offerData.images,
        description: offerData.description,
      });
      
      setShowOfferModal(false);
      alert('Teklif başarıyla gönderildi!');
    } catch (error) {
      console.error('Failed to send offer:', error);
      alert('Teklif gönderilemedi. Lütfen tekrar deneyin.');
    }
  };

  const nextImage = () => {
    if (currentListing?.images && currentListing.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === currentListing.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (currentListing?.images && currentListing.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? currentListing.images.length - 1 : prev - 1
      );
    }
  };

  const getConditionText = (condition: string) => {
    const conditionMap: Record<string, string> = {
      'yeni': 'Yeni',
      'çok_iyi': 'Çok İyi',
      'iyi': 'İyi',
      'orta': 'Orta',
      'kötü': 'Kötü'
    };
    return conditionMap[condition] || condition;
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'active': 'Aktif',
      'pending': 'Beklemede',
      'completed': 'Tamamlandı',
      'removed': 'Kaldırıldı'
    };
    return statusMap[status] || status;
  };

  const isOwner = user && currentListing && 
    (currentListing.owner?._id === user._id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !currentListing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Kitap bulunamadı</h2>
          <p className="text-gray-600 mb-6">
            {error || 'Aradığınız kitap mevcut değil veya kaldırılmış.'}
          </p>
          <Link
            to="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Kitaplara Göz At
          </Link>
        </div>
      </div>
    );
  }

  const images = currentListing.images?.length > 0 
    ? currentListing.images 
    : [currentListing.bookImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600'];

  // Use owner field from API response
  const ownerInfo = currentListing.owner || {
    username: 'Bilinmeyen Kullanıcı',
    _id: undefined,
    firstName: undefined,
    lastName: undefined,
    avatar: undefined
  };

  console.log('Owner info:', ownerInfo);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-blue-600">Ana Sayfa</Link>
          <span>›</span>
          <span className="text-gray-900">{currentListing.bookTitle}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-lg overflow-hidden shadow-sm">
              <img
                src={images[currentImageIndex]}
                alt={currentListing.bookTitle}
                className="w-full h-96 object-cover"
              />
              
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative rounded-lg overflow-hidden ${
                      index === currentImageIndex ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${currentListing.bookTitle} ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {currentListing.bookTitle}
              </h1>
              <p className="text-xl text-gray-600 mb-4">{currentListing.author}</p>
              
              <div className="flex items-center gap-4 mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {currentListing.category}
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {getConditionText(currentListing.condition)}
                </span>
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                  {getStatusText(currentListing.status)}
                </span>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {currentListing.viewCount || 0} görüntülenme
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {currentListing.location?.city}
                  {currentListing.location?.district && `, ${currentListing.location.district}`}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(currentListing.createdAt).toLocaleDateString('tr-TR')}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Açıklama</h3>
              <p className="text-gray-700 leading-relaxed">
                {currentListing.description}
              </p>
            </div>

            {/* Book Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentListing.publisher && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Yayınevi:</span>
                  <p className="text-gray-900">{currentListing.publisher}</p>
                </div>
              )}
              {currentListing.publishedYear && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Yayın Yılı:</span>
                  <p className="text-gray-900">{currentListing.publishedYear}</p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-500">Dil:</span>
                <p className="text-gray-900">{currentListing.language || 'Türkçe'}</p>
              </div>
              {currentListing.isbn && (
                <div>
                  <span className="text-sm font-medium text-gray-500">ISBN:</span>
                  <p className="text-gray-900">{currentListing.isbn}</p>
                </div>
              )}
            </div>

            {/* Wanted Books */}
            {((currentListing.wantedCategories?.length ?? 0) > 0 || (currentListing.wantedAuthors?.length ?? 0) > 0) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Aradığı Kitaplar</h3>
                {(currentListing.wantedCategories?.length ?? 0) > 0 && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-500">Kategoriler:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {currentListing.wantedCategories?.map((category, index) => (
                        <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(currentListing.wantedAuthors?.length ?? 0) > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Yazarlar:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {currentListing.wantedAuthors?.map((author, index) => (
                        <span key={index} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">
                          {author}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Owner Info */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Kitap Sahibi</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  {ownerInfo?.avatar ? (
                    <img 
                      src={ownerInfo.avatar} 
                      alt={ownerInfo.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-blue-600 font-semibold">
                      {ownerInfo?.firstName?.charAt(0)?.toUpperCase() || 
                       ownerInfo?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {ownerInfo?.firstName && ownerInfo?.lastName 
                      ? `${ownerInfo.firstName} ${ownerInfo.lastName}`
                      : ownerInfo?.username || 'Bilinmeyen Kullanıcı'
                    }
                  </p>
                  <p className="text-sm text-gray-500">@{ownerInfo?.username || 'kullanici'}</p>
                  {ownerInfo?._id && (
                    <Link
                      to={`/profile/${ownerInfo._id}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Profili Görüntüle
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t pt-6">
              {isOwner ? (
                <div className="flex gap-4">
                  <Link
                    to={`/listing/${currentListing._id}/edit`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium text-center"
                  >
                    İlanı Düzenle
                  </Link>
                  <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium">
                    İlanı Sil
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentListing.status === 'active' ? (
                    <button
                      onClick={handleSendOffer}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium text-lg"
                    >
                      Teklif Gönder
                    </button>
                  ) : (
                    <div className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-lg font-medium text-lg text-center">
                      Bu kitap artık mevcut değil
                    </div>
                  )}
                  
                  <div className="flex gap-4">
                    <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium">
                      Favorilere Ekle
                    </button>
                    <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium">
                      Paylaş
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Notes */}
            {currentListing.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Ek Notlar</h4>
                <p className="text-yellow-700 text-sm">{currentListing.notes}</p>
              </div>
            )}

            {/* Shipping Info */}
            {currentListing.shippingAvailable && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="font-medium text-green-800">Kargo Mevcut</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Bu kitap kargo ile gönderilebilir.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Send Offer Modal */}
      {showOfferModal && (
        <SendOfferModal
          listing={currentListing}
          onClose={() => setShowOfferModal(false)}
          onSubmit={handleOfferSubmit}
        />
      )}
    </div>
  );
}; 