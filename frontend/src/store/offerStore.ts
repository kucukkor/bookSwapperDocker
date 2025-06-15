import { create } from 'zustand';
import { apiService } from '../services/api';
import type { TradeOffer, CreateOfferData, OfferState } from '../types';

interface OfferStore extends OfferState {
  // Offer CRUD operations
  loadReceivedOffers: () => Promise<void>;
  loadSentOffers: () => Promise<void>;
  createOffer: (offerData: CreateOfferData) => Promise<void>;
  getOfferDetails: (offerId: string) => Promise<TradeOffer>;
  
  // 2-stage offer system
  acceptChat: (offerId: string) => Promise<void>;
  acceptOffer: (offerId: string) => Promise<void>;
  rejectOffer: (offerId: string) => Promise<void>;
  cancelOffer: (offerId: string) => Promise<void>;
  
  // UI helpers
  clearError: () => void;
  setCurrentOffer: (offer: TradeOffer | null) => void;
}

export const useOfferStore = create<OfferStore>((set) => ({
  receivedOffers: [],
  sentOffers: [],
  currentOffer: null,
  isLoading: false,
  error: null,

  loadReceivedOffers: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getReceivedOffers();
      
      // Backend response formatını kontrol et - data field'ı yoksa direkt response'u kullan
      const offersData = response.data || response;
      
      set({
        receivedOffers: Array.isArray(offersData) ? offersData as TradeOffer[] : [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load received offers',
      });
    }
  },

  loadSentOffers: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getSentOffers();
      
      // Backend response formatını kontrol et - data field'ı yoksa direkt response'u kullan
      const offersData = response.data || response;
      
      set({
        sentOffers: Array.isArray(offersData) ? offersData as TradeOffer[] : [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load sent offers',
      });
    }
  },

  createOffer: async (offerData: CreateOfferData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.createOffer(offerData);
      const newOffer = response.data as TradeOffer;
      
      set((state) => ({
        sentOffers: [newOffer, ...state.sentOffers],
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create offer',
      });
      throw error;
    }
  },

  getOfferDetails: async (offerId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getOfferDetails(offerId);
      const offer = response.data as TradeOffer;
      
      set({
        currentOffer: offer,
        isLoading: false,
        error: null,
      });
      
      return offer;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load offer details',
      });
      throw error;
    }
  },

  // 2-Stage Offer System
  acceptChat: async (offerId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.acceptChat(offerId);
      
      // Update offer status in received offers
      set((state) => ({
        receivedOffers: state.receivedOffers.map(offer =>
          offer._id === offerId
            ? { ...offer, status: 'chat_accepted' as const }
            : offer
        ),
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to accept chat',
      });
      throw error;
    }
  },

  acceptOffer: async (offerId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.acceptOffer(offerId);
      
      // Update offer status in received offers
      set((state) => ({
        receivedOffers: state.receivedOffers.map(offer =>
          offer._id === offerId
            ? { ...offer, status: 'accepted' as const }
            : offer
        ),
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to accept offer',
      });
      throw error;
    }
  },

  rejectOffer: async (offerId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.rejectOffer(offerId);
      
      // Update offer status in received offers
      set((state) => ({
        receivedOffers: state.receivedOffers.map(offer =>
          offer._id === offerId
            ? { ...offer, status: 'rejected' as const }
            : offer
        ),
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to reject offer',
      });
      throw error;
    }
  },

  cancelOffer: async (offerId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.cancelOffer(offerId);
      
      // Update offer status in sent offers
      set((state) => ({
        sentOffers: state.sentOffers.map(offer =>
          offer._id === offerId
            ? { ...offer, status: 'cancelled' as const }
            : offer
        ),
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to cancel offer',
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setCurrentOffer: (offer: TradeOffer | null) => {
    set({ currentOffer: offer });
  },
})); 