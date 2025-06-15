import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import type { Review, CreateReviewData } from '../../types';

export const ReviewsPending: React.FC = () => {
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewForms, setReviewForms] = useState<Record<string, { rating: number; comment: string }>>({});
  const [submittingReviewId, setSubmittingReviewId] = useState<string | null>(null);

  useEffect(() => {
    loadPendingReviews();
  }, []);

  const loadPendingReviews = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getPendingReviews();
      // Handle both response.data and direct response formats
      const reviewsData = (response.data || response) as Review[];
      setPendingReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bekleyen değerlendirmeler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingChange = (reviewId: string, rating: number) => {
    setReviewForms(prev => ({
      ...prev,
      [reviewId]: {
        ...prev[reviewId],
        rating
      }
    }));
  };

  const handleCommentChange = (reviewId: string, comment: string) => {
    setReviewForms(prev => ({
      ...prev,
      [reviewId]: {
        ...prev[reviewId],
        comment
      }
    }));
  };

  const handleSubmitReview = async (review: Review) => {
    const formData = reviewForms[review._id];
    
    if (!formData?.rating || formData.rating < 1 || formData.rating > 5) {
      alert('Lütfen 1-5 arasında bir puan seçin.');
      return;
    }

    setSubmittingReviewId(review._id);
    
    try {
      const reviewData: CreateReviewData = {
        tradeOfferId: review.tradeOffer._id,
        revieweeId: review.reviewee._id,
        rating: formData.rating,
        comment: formData.comment.trim() || undefined
      };

      await apiService.createReview(reviewData);
      
      // Clear form data and reload reviews
      setReviewForms(prev => {
        const newForms = { ...prev };
        delete newForms[review._id];
        return newForms;
      });
      
      await loadPendingReviews();
      alert('Değerlendirme başarıyla gönderildi!');
    } catch (error) {
      console.error('Failed to submit review:', error);
      setError(error instanceof Error ? error.message : 'Değerlendirme gönderilemedi');
    } finally {
      setSubmittingReviewId(null);
    }
  };

  const renderStarRating = (reviewId: string, currentRating: number = 0) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(reviewId, star)}
            className={`text-2xl transition-colors ${
              star <= currentRating 
                ? 'text-yellow-400 hover:text-yellow-500' 
                : 'text-gray-300 hover:text-yellow-300'
            }`}
          >
            ★
          </button>
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
          <h1 className="text-3xl font-bold text-gray-900">Bekleyen Değerlendirmeler</h1>
          <p className="text-gray-600 mt-2">
            Tamamlanan takaslarınız için değerlendirme bırakın
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {pendingReviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Bekleyen değerlendirme yok
            </h3>
            <p className="text-gray-600 mb-6">
              Harika! Tüm değerlendirmelerinizi tamamladınız. Yeni takaslar yaptığınızda değerlendirmeler burada görünecek.
            </p>
            <Link
              to="/"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Kitaplara Göz At
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingReviews.map((review: Review) => {
              const formData = reviewForms[review._id] || { rating: 0, comment: '' };
              const isSubmitting = submittingReviewId === review._id;

              return (
                <div key={review._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex gap-6">
                    {/* Trade Information */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {review.reviewee?.firstName && review.reviewee?.lastName 
                          ? `${review.reviewee.firstName} ${review.reviewee.lastName} ile Takas`
                          : `${review.reviewee?.username || 'Kullanıcı'} ile Takas`
                        }
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">@{review.reviewee?.username || 'Bilinmeyen kullanıcı'}</p>
                      
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">Takas Detayları:</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Verdiğiniz kitap:</p>
                            <p className="font-semibold">{review.tradeOffer.offeredBook.bookTitle}</p>
                            <p className="text-sm text-gray-500">{review.tradeOffer.offeredBook.author}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Aldığınız kitap:</p>
                            <p className="font-semibold">{review.tradeOffer.targetListing.bookTitle}</p>
                            <p className="text-sm text-gray-500">{review.tradeOffer.targetListing.author}</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-500">
                        Takas tarihi: {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>

                    {/* Review Form */}
                    <div className="flex-1 bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-4">Değerlendirme Bırakın</h4>
                      
                      {/* Rating */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Puan *
                        </label>
                        {renderStarRating(review._id, formData.rating)}
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.rating > 0 && `${formData.rating} yıldız - ${getRatingText(formData.rating)}`}
                        </p>
                      </div>

                      {/* Comment */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Yorum (Opsiyonel)
                        </label>
                        <textarea
                          value={formData.comment}
                          onChange={(e) => handleCommentChange(review._id, e.target.value)}
                          placeholder="Bu takas hakkındaki deneyiminizi paylaşın..."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          maxLength={500}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.comment.length}/500 karakter
                        </p>
                      </div>

                      {/* Submit Button */}
                      <button
                        onClick={() => handleSubmitReview(review)}
                        disabled={isSubmitting || !formData.rating}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
                      </button>
                    </div>
                  </div>

                  {/* Required Review Notice */}
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Bu değerlendirme takasınızı tamamlamak için gereklidir. Diğer kullanıcılara yardımcı olmak için dürüst deneyiminizi paylaşın.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Review Guidelines */}
        {pendingReviews.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Değerlendirme Kuralları</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Puan Sistemi:</h4>
                <ul className="space-y-1">
                  <li>⭐ 1 Yıldız - Çok Kötü</li>
                  <li>⭐⭐ 2 Yıldız - Kötü</li>
                  <li>⭐⭐⭐ 3 Yıldız - Orta</li>
                  <li>⭐⭐⭐⭐ 4 Yıldız - İyi</li>
                  <li>⭐⭐⭐⭐⭐ 5 Yıldız - Mükemmel</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Değerlendirme İpuçları:</h4>
                <ul className="space-y-1">
                  <li>• Kitabın durumunu değerlendirin</li>
                  <li>• İletişim kalitesini göz önünde bulundurun</li>
                  <li>• Teslimat hızını değerlendirin</li>
                  <li>• Dürüst ve yapıcı olun</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 