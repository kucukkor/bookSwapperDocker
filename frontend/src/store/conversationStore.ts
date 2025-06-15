import { create } from 'zustand';
import { apiService } from '../services/api';
import type { Conversation, Message, ConversationState } from '../types';

interface ConversationStore extends ConversationState {
  // Conversation operations
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  findConversationByOffer: (offerId: string) => Conversation | null;
  
  // UI helpers
  setCurrentConversation: (conversation: Conversation | null) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  clearError: () => void;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,

  loadConversations: async () => {
    const state = get();
    if (state.isLoading) return; // Prevent multiple simultaneous requests
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getConversations();
      
      // API direkt array döndürüyor, data wrapper yok
      const conversationsData = Array.isArray(response) ? response : [];
      
      set({
        conversations: conversationsData as Conversation[],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load conversations',
      });
    }
  },

  loadMessages: async (conversationId: string) => {
    const state = get();
    
    // Prevent loading if already loading
    if (state.isLoading) {
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getMessages(conversationId) as {
        conversation: Conversation;
        messages: Message[];
      };
      
      // API response: { conversation: {...}, messages: [...] }
      const messagesData = response.messages || [];
      const conversationData = response.conversation;
      
      set({
        messages: messagesData,
        currentConversation: conversationData,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Load messages error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load messages',
      });
    }
  },

  sendMessage: async (conversationId: string, content: string) => {
    try {
      const response = await apiService.sendMessage(conversationId, content);
      
      // API direkt message object döndürüyor
      const newMessage = response as Message;
      
      set((state) => ({
        messages: [...state.messages, newMessage],
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send message',
      });
      throw error;
    }
  },

  setCurrentConversation: (conversation: Conversation | null) => {
    set({ currentConversation: conversation });
  },

  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  clearError: () => {
    set({ error: null });
  },

  findConversationByOffer: (offerId: string): Conversation | null => {
    try {
      const state = get();
      const { conversations } = state;
      
      if (!conversations || !Array.isArray(conversations) || conversations.length === 0) {
        return null;
      }
      
      const foundConversation = conversations.find((conversation: Conversation) => {
        if (!conversation || !conversation.tradeOffer) {
          return false;
        }
        
        return conversation.tradeOffer._id === offerId;
      });
      
      return foundConversation || null;
    } catch (error) {
      console.error('Error finding conversation by offer:', error);
      return null;
    }
  },
})); 