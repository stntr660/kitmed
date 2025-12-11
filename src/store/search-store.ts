import { create } from 'zustand';
import type { SearchFilters, SearchResult, Product, SortState } from '@/types';

interface SearchStore {
  // Search state
  query: string;
  filters: SearchFilters;
  results: SearchResult<Product> | null;
  isLoading: boolean;
  error: string | null;

  // UI state
  isFiltersOpen: boolean;
  selectedView: 'grid' | 'list';
  sort: SortState;

  // Actions
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  setResults: (results: SearchResult<Product>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // UI actions
  toggleFilters: () => void;
  setView: (view: 'grid' | 'list') => void;
  setSort: (sort: SortState) => void;

  // Computed
  hasActiveFilters: () => boolean;
  getFilterCount: () => number;
}

const initialFilters: SearchFilters = {
  query: '',
  categories: [],
  manufacturers: [],
  disciplines: [],
  tags: [],
  featured: undefined,
  inStock: undefined,
  priceRange: undefined,
};

const initialSort: SortState = {
  field: 'relevance',
  direction: 'desc',
};

export const useSearchStore = create<SearchStore>((set, get) => ({
  // Initial state
  query: '',
  filters: initialFilters,
  results: null,
  isLoading: false,
  error: null,

  // UI state
  isFiltersOpen: false,
  selectedView: 'grid',
  sort: initialSort,

  // Search actions
  setQuery: (query: string) => {
    set({ query });
  },

  setFilters: (newFilters: Partial<SearchFilters>) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...newFilters,
      },
    }));
  },

  clearFilters: () => {
    set({
      filters: initialFilters,
      query: '',
    });
  },

  setResults: (results: SearchResult<Product>) => {
    set({ results, isLoading: false, error: null });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error, isLoading: false });
  },

  // UI actions
  toggleFilters: () => {
    set((state) => ({
      isFiltersOpen: !state.isFiltersOpen,
    }));
  },

  setView: (selectedView: 'grid' | 'list') => {
    set({ selectedView });
  },

  setSort: (sort: SortState) => {
    set({ sort });
  },

  // Computed properties
  hasActiveFilters: () => {
    const { filters, query } = get();

    return !!(
      query ||
      filters.categories?.length ||
      filters.manufacturers?.length ||
      filters.disciplines?.length ||
      filters.tags?.length ||
      filters.featured !== undefined ||
      filters.inStock !== undefined ||
      filters.priceRange
    );
  },

  getFilterCount: () => {
    const { filters } = get();
    let count = 0;

    if (filters.categories?.length) count++;
    if (filters.manufacturers?.length) count++;
    if (filters.disciplines?.length) count++;
    if (filters.tags?.length) count++;
    if (filters.featured !== undefined) count++;
    if (filters.inStock !== undefined) count++;
    if (filters.priceRange) count++;

    return count;
  },
}));