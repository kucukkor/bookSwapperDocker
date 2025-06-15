import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import type { ReviewsResponse } from '../../types';

interface GivenReview {
  _id: string;
  tradeOffer: {
    _id: string;
    targetListing: {
      bookTitle: string;
      author: string;
    };
    offeredBook: {
      bookTitle: string;
      author: string;
    };
  };
  reviewee: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  rating?: number;
  comment?: string;
  createdAt: string;
}

export const ReviewsGiven: React.FC = () => {
  const [givenReviews, setGivenReviews] = useState<GivenReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReviews: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    loadGivenReviews();
  }, []);

  const loadGivenReviews = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getGivenReviews({ page, limit: 10 });
      // Handle both response.data and direct response formats
      const reviewsData = (response.data || response) as ReviewsResponse;
      
      setGivenReviews(reviewsData.reviews || []);
      setPagination(reviewsData.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalReviews: 0,
        hasNextPage: false,
        hasPrevPage: false
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Verilen değerlendirmeler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    loadGivenReviews(page);
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const getRatingText = (rating: number) => {
    const ratingTexts = {
      1: 'Çok Kötü',
      2: 'Kötü', 
      3: 'Orta',
      4: 'İyi',
      5: 'Mükemmel'
    };
    return ratingTexts[rating as keyof typeof ratingTexts] || '';
  };

  const getAverageRating = () => {
    if (givenReviews.length === 0) return 0;
    const validReviews = givenReviews.filter(review => review.rating !== undefined);
    if (validReviews.length === 0) return 0;
    return validReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / validReviews.length;
  };

  const getPositiveReviewsCount = () => {
    return givenReviews.filter(review => (review.rating || 0) >= 4).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Verdiğim Değerlendirmeler</h1>
          <p className="text-gray-600 mt-2">
            Diğer kullanıcılar için bıraktığınız değerlendirmeler
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {givenReviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Henüz değerlendirme vermediniz
            </h3>
            <p className="text-gray-600 mb-6">
              Takasları tamamladığınızda ve değerlendirme bıraktığınızda burada görünecek.
            </p>
            <Link
              to="/"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Kitaplara Göz At
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {givenReviews.map((review: GivenReview) => (
                <div key={review._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex gap-6">
                    {/* Review Information */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {review.reviewee?.firstName && review.reviewee?.lastName 
                              ? `${review.reviewee.firstName} ${review.reviewee.lastName} için Değerlendirme`
                              : `${review.reviewee?.username || 'Kullanıcı'} için Değerlendirme`
                            }
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">@{review.reviewee?.username || 'Bilinmeyen kullanıcı'}</p>
                          <div className="flex items-center gap-3 mb-2">
                            {renderStarRating(review.rating || 0)}
                            <span className="text-sm text-gray-500">
                              {review.rating ? `${review.rating}/5 yıldız - ${getRatingText(review.rating || 0)}` : 'Değerlendirme yok'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                          <Link
                            to={`/profile/${review.reviewee?._id}`}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            Profili Görüntüle
                          </Link>
                        </div>
                      </div>

                      {/* Review Comment */}
                      {review.comment && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-gray-700 mb-2">Yorumunuz:</h4>
                          <p className="text-gray-700 leading-relaxed">
                            "{review.comment}"
                          </p>
                        </div>
                      )}

                      {/* Trade Details */}
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-medium text-gray-700 mb-2">Takas Detayları:</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Verdiğiniz kitap:</p>
                            <p className="font-semibold">{review.tradeOffer.offeredBook.bookTitle}</p>
                            <p className="text-gray-500">{review.tradeOffer.offeredBook.author}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Aldığınız kitap:</p>
                            <p className="font-semibold">{review.tradeOffer.targetListing.bookTitle}</p>
                            <p className="text-gray-500">{review.tradeOffer.targetListing.author}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* User Avatar */}
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                        {review.reviewee?.avatar ? (
                          <img 
                            src={review.reviewee.avatar} 
                            alt={review.reviewee?.username || 'User'}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 text-xl font-semibold">
                            {review.reviewee?.firstName?.charAt(0)?.toUpperCase() || 
                             review.reviewee?.username?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 text-center">
                        {review.reviewee?.firstName || review.reviewee?.username || 'Kullanıcı'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Önceki
                  </button>
                  
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Sayfa {pagination.currentPage} / {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Summary Stats */}
        {givenReviews.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Değerlendirme İstatistikleriniz</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {pagination.totalReviews}
                </div>
                <div className="text-sm text-gray-600">Toplam Değerlendirme</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {getAverageRating().toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Ortalama Puan</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {getPositiveReviewsCount()}
                </div>
                <div className="text-sm text-gray-600">Olumlu Değerlendirme</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((getPositiveReviewsCount() / givenReviews.length) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Olumlu Oran</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          <Link
            to="/reviews/pending"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Bekleyen Değerlendirmeleri Kontrol Et
          </Link>
        </div>
      </div>
    </div>
  );
}; 