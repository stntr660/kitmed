import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { RFPCart, RFPItem, Product } from '@/types';
import { generateId } from '@/lib/utils';
import { safeLocalStorage } from '@/lib/hydration-utils';

interface RFPStore {
  cart: RFPCart;
  isOpen: boolean;

  // Actions
  addItem: (product: Product, quantity?: number, notes?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Computed properties
  itemCount: () => number;
  hasItems: () => boolean;
  getItem: (productId: string) => RFPItem | undefined;
}

const initialCart: RFPCart = {
  items: [],
  updatedAt: new Date(),
};

export const useRFPStore = create<RFPStore>()(
  persist(
    (set, get) => ({
      cart: initialCart,
      isOpen: false,

      addItem: (product: Product, quantity = 1, notes = '') => {
        set((state) => {
          const existingItem = state.cart.items.find(
            (item) => item.productId === product.id
          );

          if (existingItem) {
            // Update existing item
            const updatedItems = state.cart.items.map((item) =>
              item.productId === product.id
                ? {
                    ...item,
                    quantity: item.quantity + quantity,
                    notes: notes || item.notes,
                  }
                : item
            );

            return {
              ...state,
              cart: {
                items: updatedItems,
                updatedAt: new Date(),
              },
            };
          } else {
            // Add new item
            const newItem: RFPItem = {
              productId: product.id,
              product,
              quantity,
              notes,
              addedAt: new Date(),
            };

            return {
              ...state,
              cart: {
                items: [...state.cart.items, newItem],
                updatedAt: new Date(),
              },
            };
          }
        });
      },

      removeItem: (productId: string) => {
        set((state) => ({
          ...state,
          cart: {
            items: state.cart.items.filter((item) => item.productId !== productId),
            updatedAt: new Date(),
          },
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          ...state,
          cart: {
            items: state.cart.items.map((item) =>
              item.productId === productId
                ? { ...item, quantity }
                : item
            ),
            updatedAt: new Date(),
          },
        }));
      },

      updateNotes: (productId: string, notes: string) => {
        set((state) => ({
          ...state,
          cart: {
            items: state.cart.items.map((item) =>
              item.productId === productId
                ? { ...item, notes }
                : item
            ),
            updatedAt: new Date(),
          },
        }));
      },

      clearCart: () => {
        set((state) => ({
          ...state,
          cart: initialCart,
        }));
      },

      toggleCart: () => {
        set((state) => ({
          ...state,
          isOpen: !state.isOpen,
        }));
      },

      openCart: () => {
        set((state) => ({
          ...state,
          isOpen: true,
        }));
      },

      closeCart: () => {
        set((state) => ({
          ...state,
          isOpen: false,
        }));
      },

      // Computed properties
      itemCount: () => {
        const { cart } = get();
        return cart.items.reduce((total, item) => total + item.quantity, 0);
      },

      hasItems: () => {
        const { cart } = get();
        return cart.items.length > 0;
      },

      getItem: (productId: string) => {
        const { cart } = get();
        return cart.items.find((item) => item.productId === productId);
      },
    }),
    {
      name: 'kitmed-rfp-cart',
      storage: createJSONStorage(() => safeLocalStorage()),
      partialize: (state) => ({
        cart: state.cart,
      }),
    }
  )
);