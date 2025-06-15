import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBookStore, useOfferStore, useConversationStore } from '../../store';

export const MyListings: React.FC = () => {
  const navigate = useNavigate();
  const { 
    myListings, 
    loadMyListings, 
    archiveListing, 
    isLoading: listingsLoading 
  } = useBookStore();
  const { 
    sentOffers, 
    receivedOffers, 
    loadSentOffers, 
    loadReceivedOffers, 
    acceptChat,
    acceptOffer,
    rejectOffer,
    cancelOffer,
    isLoading: offersLoading 
  } = useOfferStore();
  const { 
    findConversationByOffer,
    loadConversations 
  } = useConversationStore();
  
  const [activeTab, setActiveTab] = useState('Active Listings');
  const [archiveSubTab, setArchiveSubTab] = useState('My Listings Archive');
  const [archivingListingId, setArchivingListingId] = useState<string | null>(null);
  const [processingOfferId, setProcessingOfferId] = useState<string | null>(null);

  useEffect(() => {
    loadMyListings();
    loadSentOffers();
    loadReceivedOffers();
    loadConversations();
  }, []);

  const isLoading = listingsLoading || offersLoading;

  // Add safety checks for undefined data and status properties
  const safeMyListings = Array.isArray(myListings) ? myListings.filter(listing => listing && typeof listing === 'object' && listing.status) : [];
  const safeSentOffers = Array.isArray(sentOffers) ? sentOffers.filter(offer => offer && typeof offer === 'object' && offer.status) : [];
  const safeReceivedOffers = Array.isArray(receivedOffers) ? receivedOffers.filter(offer => offer && typeof offer === 'object' && offer.status) : [];

  // Filter data based on backend status values with safety checks
  const activeListings = safeMyListings.filter(listing => listing.status === 'active');
  const archivedListings = safeMyListings.filter(listing => listing.status !== 'active');
  
  // Active received offers
  const activeReceivedOffers = safeReceivedOffers.filter(offer => 
    offer.status === 'pending' || offer.status === 'chat_accepted'
  );
  
  // Active sent offers
  const activeSentOffers = safeSentOffers.filter(offer => 
    offer.status === 'pending' || offer.status === 'chat_accepted'
  );

  // Archived offers (both received and sent)
  const archivedReceivedOffers = safeReceivedOffers.filter(offer => 
    offer.status === 'accepted' || offer.status === 'rejected'
  );
  const archivedSentOffers = safeSentOffers.filter(offer => 
    offer.status === 'accepted' || offer.status === 'rejected' || offer.status === 'cancelled'
  );

  const tabs = [
    { 
      name: 'Active Listings', 
      count: activeListings.length 
    },
    { 
      name: 'Received Offers', 
      count: activeReceivedOffers.length 
    },
    { 
      name: 'Sent Offers', 
      count: activeSentOffers.length 
    },
    { 
      name: 'Archive', 
      count: archivedListings.length + archivedReceivedOffers.length + archivedSentOffers.length 
    }
  ];

  const archiveSubTabs = [
    { 
      name: 'My Listings Archive', 
      count: archivedListings.length 
    },
    { 
      name: 'Received Offers Archive', 
      count: archivedReceivedOffers.length 
    },
    { 
      name: 'Sent Offers Archive', 
      count: archivedSentOffers.length 
    }
  ];

  const getFilteredContent = () => {
    if (activeTab === 'Active Listings') {
      return activeListings;
    } else if (activeTab === 'Received Offers') {
      return activeReceivedOffers;
    } else if (activeTab === 'Sent Offers') {
      return activeSentOffers;
    } else if (activeTab === 'Archive') {
      if (archiveSubTab === 'My Listings Archive') {
        return archivedListings;
      } else if (archiveSubTab === 'Received Offers Archive') {
        return archivedReceivedOffers;
      } else {
        return archivedSentOffers;
      }
    }
    return [];
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      chat_accepted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Chat Accepted' },
      accepted: { bg: 'bg-green-100', text: 'text-green-800', label: 'Accepted' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
      active: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Active' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      removed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Archived' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const hasActiveOffers = (listingId: string) => {
    return safeReceivedOffers.some(offer => 
      offer.targetListing &&
      (typeof offer.targetListing === 'string' ? offer.targetListing : offer.targetListing._id) === listingId &&
      (offer.status === 'pending' || offer.status === 'chat_accepted')
    );
  };

  const handleArchiveListing = async (listingId: string) => {
    if (hasActiveOffers(listingId)) {
      alert('This listing has active offers and cannot be archived. Please handle the offers first.');
      return;
    }

    if (!confirm('Are you sure you want to archive this listing? This action cannot be undone.')) {
      return;
    }

    setArchivingListingId(listingId);
    try {
      await archiveListing(listingId);
      alert('Listing archived successfully.');
    } catch (error) {
      console.error('Failed to archive listing:', error);
      alert('Failed to archive listing. Please try again.');
    } finally {
      setArchivingListingId(null);
    }
  };

  const handleAcceptChat = async (offerId: string) => {
    if (!confirm('Accept this chat request? This will start a conversation with the user.')) {
      return;
    }

    setProcessingOfferId(offerId);
    try {
      await acceptChat(offerId);
      alert('Chat accepted! You can now message with the user.');
      // Reload offers to get updated status
      await loadReceivedOffers();
    } catch (error) {
      console.error('Failed to accept chat:', error);
      alert('Failed to accept chat. Please try again.');
    } finally {
      setProcessingOfferId(null);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    if (!confirm('Accept this offer? This will complete the trade and archive both listings.')) {
      return;
    }

    setProcessingOfferId(offerId);
    try {
      await acceptOffer(offerId);
      alert('Offer accepted! Trade completed successfully.');
      // Reload both offers and listings to get updated status
      await Promise.all([loadReceivedOffers(), loadMyListings()]);
    } catch (error) {
      console.error('Failed to accept offer:', error);
      alert('Failed to accept offer. Please try again.');
    } finally {
      setProcessingOfferId(null);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    if (!confirm('Reject this offer? This action cannot be undone.')) {
      return;
    }

    setProcessingOfferId(offerId);
    try {
      await rejectOffer(offerId);
      alert('Offer rejected.');
      // Reload offers to get updated status
      await loadReceivedOffers();
    } catch (error) {
      console.error('Failed to reject offer:', error);
      alert('Failed to reject offer. Please try again.');
    } finally {
      setProcessingOfferId(null);
    }
  };

  const handleCancelOffer = async (offerId: string) => {
    if (!confirm('Cancel this offer? This action cannot be undone.')) {
      return;
    }

    setProcessingOfferId(offerId);
    try {
      await cancelOffer(offerId);
      alert('Offer cancelled.');
      // Reload offers to get updated status
      await loadSentOffers();
    } catch (error) {
      console.error('Failed to cancel offer:', error);
      alert('Failed to cancel offer. Please try again.');
    } finally {
      setProcessingOfferId(null);
    }
  };

  // Handle navigation to chat
  const handleGoToChat = (offerId: string) => {
    const conversation = findConversationByOffer(offerId);
    if (conversation) {
      navigate(`/messages/${conversation._id}`);
    } else {
      // Fallback to general messages page
      navigate('/messages');
    }
  };

  const renderListingCard = (listing: any) => {
    const hasOffers = hasActiveOffers(listing._id);
    const isArchiving = archivingListingId === listing._id;
    
    return (
      <div key={listing._id} className="p-6 flex gap-6">
        <img
          src={listing.images?.[0] || listing.bookImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300'}
          alt={listing.bookTitle}
          className="w-20 h-28 object-cover rounded-lg"
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{listing.bookTitle}</h3>
          <p className="text-gray-600 text-sm mb-2">by {listing.author}</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 text-sm">✓ {listing.condition}</span>
            {getStatusBadge(listing.status)}
          </div>
          <p className="text-gray-600 text-sm">{listing.description}</p>
          <div className="mt-2 text-xs text-gray-500">
            <span>Views: {listing.viewCount || 0}</span>
            <span className="mx-2">•</span>
            <span>Offers: {listing.offerCount || 0}</span>
          </div>
          
          {/* Active offers warning */}
          {hasOffers && listing.status === 'active' && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              ⚠️ This listing has active offers and cannot be edited or archived
            </div>
          )}
        </div>
        <div className="flex flex-col items-end justify-between">
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">{listing.location?.city}</div>
            <div className="text-xs text-gray-400">
              {new Date(listing.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="flex gap-2">
            {listing.status === 'active' && (
              <>
                <Link
                  to={`/listing/${listing._id}/edit`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    hasOffers 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  onClick={(e) => hasOffers && e.preventDefault()}
                >
                  Edit
                </Link>
                <button 
                  onClick={() => handleArchiveListing(listing._id)}
                  disabled={hasOffers || isArchiving}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    hasOffers || isArchiving
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  title={hasOffers ? 'Cannot archive listing with active offers' : 'Archive this listing'}
                >
                  {isArchiving ? 'Archiving...' : 'Archive'}
                </button>
              </>
            )}
            {listing.status !== 'active' && (
              <Link
                to={`/listing/${listing._id}`}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                View Details
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderOfferCard = (offer: any) => {
    // Handle populated vs non-populated targetListing
    const targetListing = typeof offer.targetListing === 'object' 
      ? offer.targetListing 
      : { bookTitle: 'Unknown Book', images: [] };

    const isProcessing = processingOfferId === offer._id;

    return (
      <div key={offer._id} className="p-6 flex gap-6">
        <img
          src={targetListing.images?.[0] || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300'}
          alt={targetListing.bookTitle}
          className="w-20 h-28 object-cover rounded-lg"
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{targetListing.bookTitle}</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-600 text-sm">
              Offered to: {typeof offer.toUser === 'object' ? offer.toUser.username : 'User'}
            </span>
            {getStatusBadge(offer.status)}
          </div>
          <div className="bg-gray-50 rounded-lg p-3 mb-2">
            <h4 className="font-medium text-sm text-gray-700 mb-1">Your Offer:</h4>
            <p className="text-sm font-semibold">{offer.bookTitle}</p>
            <p className="text-xs text-gray-600">{offer.description}</p>
          </div>
          <p className="text-xs text-gray-500">
            Sent on {new Date(offer.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col items-end justify-between">
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">{offer.condition}</div>
            <div className="text-xs text-gray-400">
              {offer.status === 'chat_accepted' && offer.chatAcceptedDate && 
                `Chat: ${new Date(offer.chatAcceptedDate).toLocaleDateString()}`
              }
              {offer.status === 'accepted' && offer.completedDate && 
                `Completed: ${new Date(offer.completedDate).toLocaleDateString()}`
              }
            </div>
          </div>
          <div className="flex gap-2">
            {offer.status === 'pending' && (
              <>
                <button 
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Edit Offer
                </button>
                <button 
                  onClick={() => handleCancelOffer(offer._id)}
                  disabled={isProcessing}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {isProcessing ? 'Cancelling...' : 'Cancel'}
                </button>
              </>
            )}
            {offer.status === 'chat_accepted' && (
              <button
                onClick={() => handleGoToChat(offer._id)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Go to Chat
              </button>
            )}
            {offer.status === 'accepted' && (
              <Link
                to={`/reviews/pending`}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Leave Review
              </Link>
            )}
            {(offer.status === 'rejected' || offer.status === 'cancelled') && (
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                View Details
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderReceivedOfferCard = (offer: any) => {
    // Handle populated vs non-populated targetListing
    const targetListing = typeof offer.targetListing === 'object' 
      ? offer.targetListing 
      : { bookTitle: 'Unknown Book', images: [] };
    
    const fromUser = typeof offer.fromUser === 'object' 
      ? offer.fromUser 
      : { username: 'Unknown User', id: offer.fromUser };

    const isProcessing = processingOfferId === offer._id;

    return (
      <div key={offer._id} className="p-6 flex gap-6">
        <img
          src={targetListing.images?.[0] || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300'}
          alt={targetListing.bookTitle}
          className="w-20 h-28 object-cover rounded-lg"
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">Your Book: {targetListing.bookTitle}</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-600 text-sm">
              Offer from: {fromUser.username}
            </span>
            {getStatusBadge(offer.status)}
          </div>
          <div className="bg-gray-50 rounded-lg p-3 mb-2">
            <h4 className="font-medium text-sm text-gray-700 mb-1">Offered Book:</h4>
            <p className="text-sm font-semibold">{offer.bookTitle}</p>
            <p className="text-xs text-gray-600">by {offer.author}</p>
            <p className="text-xs text-gray-500">{offer.category} • {offer.condition}</p>
            {offer.description && (
              <p className="text-xs text-gray-600 mt-1">{offer.description}</p>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Received on {new Date(offer.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col items-end justify-between">
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">{offer.condition}</div>
          </div>
          <div className="flex gap-2">
            {offer.status === 'pending' && (
              <>
                <button 
                  onClick={() => handleAcceptChat(offer._id)}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {isProcessing ? 'Accepting...' : 'Accept Chat'}
                </button>
                <button 
                  onClick={() => handleRejectOffer(offer._id)}
                  disabled={isProcessing}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {isProcessing ? 'Rejecting...' : 'Reject'}
                </button>
              </>
            )}
            {offer.status === 'chat_accepted' && (
              <>
                <button 
                  onClick={() => handleAcceptOffer(offer._id)}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {isProcessing ? 'Accepting...' : 'Accept Offer'}
                </button>
                <button
                  onClick={() => handleGoToChat(offer._id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Go to Chat
                </button>
              </>
            )}
            {offer.status === 'accepted' && (
              <Link
                to={`/reviews/pending`}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Leave Review
              </Link>
            )}
            {(offer.status === 'rejected' || offer.status === 'cancelled') && (
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                View Details
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const filteredContent = getFilteredContent();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">My Listings</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Tabs */}
        <div className="flex space-x-1 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`px-6 py-3 rounded-lg font-medium ${
                activeTab === tab.name
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab.name} ({tab.count})
            </button>
          ))}
        </div>

        {/* Archive Sub Tabs */}
        {activeTab === 'Archive' && (
          <div className="flex space-x-1 mb-6">
            {archiveSubTabs.map((subTab) => (
              <button
                key={subTab.name}
                onClick={() => setArchiveSubTab(subTab.name)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  archiveSubTab === subTab.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {subTab.name} ({subTab.count})
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredContent.map((item: any) => {
                // Check if item is an offer (has targetListing property)
                if ('targetListing' in item) {
                  // Check if it's a received offer (has fromUser) or sent offer (has toUser)
                  if (activeTab === 'Received Offers' || archiveSubTab === 'Received Offers Archive') {
                    return renderReceivedOfferCard(item);
                  } else {
                    return renderOfferCard(item);
                  }
                } else {
                  // It's a listing
                  return renderListingCard(item);
                }
              })}
              
              {filteredContent.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <div className="text-6xl mb-4">
                    {activeTab === 'Active Listings' ? '📚' : 
                     activeTab === 'Received Offers' ? '🤝' :
                     activeTab === 'Sent Offers' ? '🤝' : '📦'}
                  </div>
                  <p className="text-lg mb-2">
                    {activeTab === 'Active Listings' ? 'No active listings found' :
                     activeTab === 'Received Offers' ? 'No received offers found' :
                     activeTab === 'Sent Offers' ? 'No sent offers found' :
                     archiveSubTab === 'My Listings Archive' ? 'No archived listings found' :
                     archiveSubTab === 'Received Offers Archive' ? 'No archived received offers found' :
                     'No archived sent offers found'}
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    {activeTab === 'Active Listings' ? 'Create your first book listing to start exchanging!' :
                     activeTab === 'Received Offers' ? 'Browse books and send your first offer!' :
                     activeTab === 'Sent Offers' ? 'Browse books and receive your first offer!' :
                     'Your archived items will appear here.'}
                  </p>
                  {activeTab === 'Active Listings' && (
                    <Link
                      to="/add-listing"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      Add Your First Book
                    </Link>
                  )}
                  {activeTab === 'Received Offers' && (
                    <Link
                      to="/"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      Browse Books
                    </Link>
                  )}
                  {activeTab === 'Sent Offers' && (
                    <Link
                      to="/"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      Browse Books
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {filteredContent.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Listings</h3>
              <p className="text-3xl font-bold text-blue-600">
                {activeListings.length}
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Received Offers</h3>
              <p className="text-3xl font-bold text-green-600">
                {activeReceivedOffers.length}
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sent Offers</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {activeSentOffers.length}
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed Trades</h3>
              <p className="text-3xl font-bold text-purple-600">
                {safeSentOffers.filter(o => o.status === 'accepted').length + 
                 safeReceivedOffers.filter(o => o.status === 'accepted').length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};