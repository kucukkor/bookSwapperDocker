import { create } from 'zustand';
import { apiService } from '../services/api';
import type { BookListing, CreateListingData, UpdateListingData, BookState, FilterOptions } from '../types';

interface BookStore extends BookState {
  // Listing operations
  loadListings: (filters?: FilterOptions) => Promise<void>;
  loadMyListings: () => Promise<void>;
  createListing: (listingData: CreateListingData) => Promise<void>;
  getListingDetails: (id: string) => Promise<BookListing>;
  updateListing: (id: string, updates: UpdateListingData) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  archiveListing: (id: string) => Promise<void>;
  
  // UI helpers
  setCurrentListing: (listing: BookListing | null) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useBookStore = create<BookStore>((set) => ({
  listings: [],
  myListings: [],
  currentListing: null,
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false,
  },

  loadListings: async (filters?: FilterOptions) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getListings(filters);
      
      // Response direkt array olabilir veya {data: array} formatında olabilir
      const listingsData = Array.isArray(response) ? response : (response.data || []);
      
      set({
        listings: listingsData as BookListing[],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load listings',
      });
    }
  },

  loadMyListings: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getMyListings();
      
      // Backend response formatını kontrol et - data field'ı yoksa direkt response'u kullan
      const listingsData = response.data || response;
      
      set({
        myListings: Array.isArray(listingsData) ? listingsData as BookListing[] : [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load my listings',
      });
    }
  },

  createListing: async (listingData: CreateListingData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.createListing(listingData);
      
      // Handle different response formats - response should contain the new listing data
      const newListing = (response.data || response) as BookListing;
      
      // Ensure the listing has all required properties
      const safeNewListing: BookListing = {
        ...newListing,
        status: newListing.status || 'active',
        viewCount: newListing.viewCount || 0,
        offerCount: newListing.offerCount || 0,
        createdAt: newListing.createdAt || new Date().toISOString(),
        updatedAt: newListing.updatedAt || new Date().toISOString(),
      };
      
      set((state) => ({
        myListings: [safeNewListing, ...state.myListings],
        listings: [safeNewListing, ...state.listings],
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create listing',
      });
      throw error;
    }
  },

  getListingDetails: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getListingDetails(id);
      const listing = response.data as BookListing;
      
      set({
        currentListing: listing,
        isLoading: false,
        error: null,
      });
      
      return listing;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load listing details',
      });
      throw error;
    }
  },

  updateListing: async (id: string, updates: UpdateListingData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.updateListing(id, updates);
      const updatedListing = response.data as BookListing;
      
      set((state) => ({
        myListings: state.myListings.map(listing =>
          listing._id === id ? updatedListing : listing
        ),
        listings: state.listings.map(listing =>
          listing._id === id ? updatedListing : listing
        ),
        currentListing: state.currentListing?._id === id ? updatedListing : state.currentListing,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update listing',
      });
      throw error;
    }
  },

  deleteListing: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.deleteListing(id);
      
      set((state) => ({
        myListings: state.myListings.filter(listing => listing._id !== id),
        listings: state.listings.filter(listing => listing._id !== id),
        currentListing: state.currentListing?._id === id ? null : state.currentListing,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete listing',
      });
      throw error;
    }
  },

  archiveListing: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.archiveListing(id);
      
      set((state) => ({
        myListings: state.myListings.filter(listing => listing._id !== id),
        listings: state.listings.filter(listing => listing._id !== id),
        currentListing: state.currentListing?._id === id ? null : state.currentListing,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to archive listing',
      });
      throw error;
    }
  },

  setCurrentListing: (listing: BookListing | null) => {
    set({ currentListing: listing });
  },

  setFilters: (filters: Partial<FilterOptions>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
})); 