import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConversationStore, useAuthStore } from '../../store';
import useSocket from '../../hooks/useSocket';
import type { Conversation } from '../../types';

export const Messages: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { 
    conversations, 
    currentConversation, 
    messages, 
    loadConversations, 
    loadMessages, 
    sendMessage, 
    setCurrentConversation,
    clearMessages,
    isLoading, 
    error
  } = useConversationStore();
  
  const { user } = useAuthStore();
  
  const { 
    joinConversation, 
    leaveConversation, 
    sendMessage: socketSendMessage,
    isConnected
  } = useSocket();
  
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [hasLoadedConversations, setHasLoadedConversations] = useState(false);
  const [loadedConversationId, setLoadedConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations only once on mount
  useEffect(() => {
    if (!hasLoadedConversations && !isLoading) {
      loadConversations().then(() => {
        setHasLoadedConversations(true);
      }).catch((error) => {
        console.error('Failed to load conversations:', error);
      });
    }
  }, [hasLoadedConversations, isLoading, loadConversations]);

  // Auto-select conversation from URL parameter or first conversation
  useEffect(() => {
    if (conversations.length > 0 && hasLoadedConversations) {
      if (conversationId) {
        // Select conversation from URL
        const targetConversation = conversations.find(conv => conv._id === conversationId);
        if (targetConversation && currentConversation?._id !== conversationId) {
          setCurrentConversation(targetConversation);
        }
      } else if (!currentConversation && !conversationId) {
        // Auto-select first conversation if none selected and no URL param
        const firstConversation = conversations[0];
        if (firstConversation) {
          navigate(`/messages/${firstConversation._id}`, { replace: true });
        }
      }
    }
  }, [conversationId, conversations, currentConversation?._id, setCurrentConversation, hasLoadedConversations, navigate]);

  // Load messages when conversation changes (only once per conversation)
  useEffect(() => {
    if (currentConversation && loadedConversationId !== currentConversation._id) {
      setLoadedConversationId(currentConversation._id);
      loadMessages(currentConversation._id);
    } else if (!currentConversation) {
      clearMessages();
      setLoadedConversationId(null);
    }
  }, [currentConversation?._id]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleConversationSelect = useCallback((conversation: Conversation) => {
    if (currentConversation?._id !== conversation._id) {
      // Navigate to conversation URL
      navigate(`/messages/${conversation._id}`);
    }
  }, [currentConversation?._id, navigate]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !currentConversation || isSending) {
      return;
    }

    const content = messageText.trim();
    setMessageText('');
    setIsSending(true);

    try {
      // Use API for message sending (more reliable for now)
      await sendMessage(currentConversation._id, content);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message text on error
      setMessageText(content);
    } finally {
      setIsSending(false);
    }
  };

  const getOtherParticipant = useCallback((conversation: Conversation) => {
    if (!user) {
      return null;
    }
    
    // API'den gelen participants array'inde User object'leri var
    // user._id ile karşılaştırma yapıyoruz
    const otherParticipant = conversation.participants.find(participant => {
      return participant._id !== user._id;
    });
    
    return otherParticipant || null;
  }, [user]);

  const formatMessageTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('tr-TR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  }, []);

  const getConversationTitle = useCallback((conversation: Conversation) => {
    const otherParticipant = getOtherParticipant(conversation);
    
    if (otherParticipant) {
      return otherParticipant.username;
    }
    return 'Unknown User';
  }, [getOtherParticipant]);

  const getConversationSubtitle = useCallback((conversation: Conversation) => {
    // Kitap bilgilerini göster
    if (conversation.listing && conversation.tradeOffer) {
      return `${conversation.listing.bookTitle} ↔ ${conversation.tradeOffer.offeredBook.bookTitle}`;
    }
    return 'Book exchange';
  }, []);

  const getLastMessagePreview = useCallback((conversation: Conversation) => {
    // API'de lastMessage field'ı yok, genel mesaj gösterelim
    if (conversation.lastMessageAt) {
      return 'Click to view messages';
    }
    return 'No messages yet';
  }, []);

  const getConversationAvatar = useCallback((conversation: Conversation) => {
    const otherParticipant = getOtherParticipant(conversation);
    
    if (otherParticipant?.avatar) {
      return otherParticipant.avatar;
    }
    
    // Fallback to first letter of username
    const username = otherParticipant?.username || 'U';
    return username.charAt(0).toUpperCase();
  }, [getOtherParticipant]);

  if (isLoading && (!conversations || conversations.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">
            Chat with other book lovers about your exchanges
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex h-[calc(100vh-120px)]">
          {/* Conversations List */}
          <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
              {!isConnected && (
                <p className="text-sm text-yellow-600 mt-1">
                  ⚠️ Real-time messaging unavailable
                </p>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-b border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="divide-y divide-gray-200">
              {(conversations || []).length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No conversations yet
                  </h3>
                  <p className="text-sm">
                    Start exchanging books to begin conversations with other users.
                  </p>
                </div>
              ) : (
                (conversations || []).map((conversation) => {
                  const isSelected = currentConversation?._id === conversation._id;
                  const otherParticipant = getOtherParticipant(conversation);
                  const avatarContent = getConversationAvatar(conversation);
                  
                  return (
                    <button
                      key={conversation._id}
                      onClick={() => handleConversationSelect(conversation)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {otherParticipant?.avatar ? (
                            <img 
                              src={otherParticipant.avatar} 
                              alt={otherParticipant.username}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-blue-600 font-semibold text-lg">
                              {avatarContent}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {getConversationTitle(conversation)}
                            </h3>
                            {conversation.lastMessageAt && (
                              <span className="text-xs text-gray-500">
                                {formatMessageTime(conversation.lastMessageAt)}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {getConversationSubtitle(conversation)}
                          </p>
                          
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {getLastMessagePreview(conversation)}
                          </p>
                          
                          {conversation.status === 'ended' && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              Conversation ended
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <div className="bg-white border-b border-gray-200 p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {(() => {
                        const otherParticipant = getOtherParticipant(currentConversation);
                        const avatarContent = getConversationAvatar(currentConversation);
                        
                        return otherParticipant?.avatar ? (
                          <img 
                            src={otherParticipant.avatar} 
                            alt={otherParticipant.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-blue-600 font-semibold">
                            {avatarContent}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {getConversationTitle(currentConversation)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {getConversationSubtitle(currentConversation)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {currentConversation.status === 'active' ? 'Active conversation' : 'Conversation ended'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (messages || []).length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-4xl mb-4">👋</div>
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    (messages || []).map((message) => {
                      // user._id ile message.sender._id karşılaştırması
                      const isOwnMessage = message.sender._id === user?._id;
                      
                      return (
                        <div
                          key={message._id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            {!isOwnMessage && (
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                {message.sender.avatar ? (
                                  <img 
                                    src={message.sender.avatar} 
                                    alt={message.sender.username}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-gray-600 text-sm font-medium">
                                    {message.sender.username.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                isOwnMessage
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-900'
                              }`}
                            >
                              {message.messageType === 'system' && (
                                <p className={`text-xs mb-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                                  System Message
                                </p>
                              )}
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                                }`}
                              >
                                {formatMessageTime(message.createdAt)}
                                {isOwnMessage && message.isRead && (
                                  <span className="ml-1">✓✓</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {currentConversation.status === 'active' ? (
                  <div className="bg-white border-t border-gray-200 p-4">
                    <form onSubmit={handleSendMessage} className="flex space-x-4">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSending}
                      />
                      <button
                        type="submit"
                        disabled={!messageText.trim() || isSending}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSending ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </div>
                        ) : (
                          'Send'
                        )}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-t border-gray-200 p-4 text-center">
                    <p className="text-gray-500">This conversation has ended.</p>
                  </div>
                )}
              </>
            ) : (
              /* No Conversation Selected */
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p>Choose a conversation from the list to start messaging.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 