import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useBookStore, useOfferStore, useAuthStore } from '../../store';
import { SendOfferModal } from '../../components';
import type { BookListing } from '../../types';

export const Home: React.FC = () => {
  const { listings, loadListings, isLoading, error, setFilters } = useBookStore();
  const { createOffer } = useOfferStore();
  const { isAuthenticated } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<BookListing | null>(null);

  const handleSearch = useCallback(() => {
    const filterParams = {
      ...(searchQuery && { author: searchQuery }), // Backend'de author search var
      ...(selectedCategory && { category: selectedCategory }),
      ...(selectedCondition && { condition: selectedCondition }),
      ...(selectedCity && { city: selectedCity }),
    };
    
    loadListings(filterParams);
    setFilters(filterParams);
  }, [searchQuery, selectedCategory, selectedCondition, selectedCity, loadListings, setFilters]);

  // Load listings on component mount and when filters change
  useEffect(() => {
    // İlk yüklemede tüm kitapları getir
    handleSearch();
  }, [handleSearch]);

  const handleSendOffer = (listing: BookListing) => {
    setSelectedListing(listing);
    setShowOfferModal(true);
  };

  const handleOfferSubmit = async (offerData: any) => {
    if (!selectedListing) return;
    
    const createOfferPayload = {
      targetListing: selectedListing._id,
      bookTitle: offerData.bookTitle,
      author: offerData.author,
      category: offerData.category,
      condition: offerData.condition,
      images: offerData.images,
      description: offerData.description,
    };
    
    try {
      await createOffer(createOfferPayload);
      
      setShowOfferModal(false);
      setSelectedListing(null);
      
      toast.success('Offer sent successfully!');
    } catch (error) {
      console.error('Failed to send offer:', error);
      
      // Backend'den gelen hata mesajını göster
      const errorMessage = error instanceof Error ? error.message : 'Failed to send offer. Please try again.';
      toast.error(errorMessage);
      
      // Modal'ı kapat
      setShowOfferModal(false);
      setSelectedListing(null);
    }
  };

  const categories = [
    'Roman', 'Bilim Kurgu', 'Fantastik', 'Tarih', 'Biyografi', 
    'Felsefe', 'Psikoloji', 'Sanat', 'Bilim', 'Çocuk Kitapları'
  ];

  const conditions = [
    { value: 'yeni', label: 'Yeni' },
    { value: 'çok_iyi', label: 'Çok İyi' },
    { value: 'iyi', label: 'İyi' },
    { value: 'orta', label: 'Orta' },
    { value: 'kötü', label: 'Kötü' }
  ];

  const cities = [
    'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 
    'Adana', 'Konya', 'Gaziantep', 'Mersin', 'Diyarbakır'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Book Swap Platform
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Exchange books, discover new stories, build a reading community
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex rounded-lg overflow-hidden shadow-lg">
              <input
                type="text"
                placeholder="Search by author, title, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-6 py-4 text-gray-900 text-lg focus:outline-none"
              />
              <button 
                onClick={handleSearch}
                className="bg-yellow-500 hover:bg-yellow-600 px-8 py-4 font-semibold transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Filters</h3>
              
              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Condition Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Conditions</option>
                  {conditions.map(condition => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  setSelectedCondition('');
                  setSelectedCity('');
                  // Filtreleri temizledikten sonra arama yap
                  setTimeout(handleSearch, 0);
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Available Books ({listings?.length || 0})
              </h2>
              <Link
                to="/add-listing"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Add Your Book
              </Link>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {/* Loading State */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                    <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                    <div className="bg-gray-300 h-4 rounded mb-2"></div>
                    <div className="bg-gray-300 h-4 rounded w-3/4 mb-2"></div>
                    <div className="bg-gray-300 h-4 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              /* Books Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {(listings || []).map((listing) => (
                  <div key={listing._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <Link to={`/listing/${listing._id}`}>
                      <img
                        src={listing.images?.[0] || listing.bookImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'}
                        alt={listing.bookTitle}
                        className="w-full h-48 object-cover"
                      />
                    </Link>
                    
                    <div className="p-6">
                      <Link to={`/listing/${listing._id}`}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                          {listing.bookTitle}
                        </h3>
                      </Link>
                      
                      <p className="text-gray-600 text-sm mb-2">by {listing.author}</p>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {listing.category}
                        </span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {listing.condition}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {listing.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>📍 {listing.location?.city}</span>
                        <span>👁️ {listing.viewCount || 0} views</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link
                          to={`/listing/${listing._id}`}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md text-center transition-colors"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleSendOffer(listing)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
                        >
                          Send Offer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && (!listings || listings.length === 0) && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No books found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or browse all available books.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('');
                    setSelectedCondition('');
                    setSelectedCity('');
                    // Filtreleri temizledikten sonra arama yap
                    setTimeout(handleSearch, 0);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Send Offer Modal */}
      {showOfferModal && selectedListing && (
        <SendOfferModal
          listing={selectedListing}
          onClose={() => {
            setShowOfferModal(false);
            setSelectedListing(null);
          }}
          onSubmit={handleOfferSubmit}
        />
      )}
    </div>
  );
}; 