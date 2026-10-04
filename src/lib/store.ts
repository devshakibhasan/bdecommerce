import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, CartItem, Product, ProductVariant } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      login: (token, user) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(user));
          } catch (e) {}
        }
        set({ token, user, isAuthenticated: true, hasHydrated: true });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          } catch (e) {}
        }
        set({ token: null, user: null, isAuthenticated: false, hasHydrated: true });
      },
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);

interface CartState {
  items: CartItem[];
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  removeItem: (identifier: string | number) => void;
  updateQuantity: (identifier: string | number, quantity: number) => void;
  updateVariant: (identifier: string | number, newVariant: ProductVariant) => void;
  clearCart: () => void;
  purgeCorruptedItems: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const sanitizeItem = (item: any): CartItem | null => {
  if (!item || typeof item !== 'object') return null;
  const product = item.product;
  if (!product || (!product.id && !product.slug && !product.name_en)) {
    return null; // Discard invalid/undefined items
  }

  const safeProduct: Product = {
    id: Number(product.id) || 1,
    name_en: product.name_en || product.title || 'Product',
    name_bn: product.name_bn || null,
    slug: product.slug || `product-${product.id || 1}`,
    base_price: Number(product.base_price ?? product.current_price ?? product.price ?? 0),
    compare_price: product.compare_price ? Number(product.compare_price) : null,
    cost_price: null,
    sku_prefix: product.sku_prefix || null,
    short_description_en: product.short_description_en || null,
    short_description_bn: product.short_description_bn || null,
    description_en: product.description_en || null,
    description_bn: product.description_bn || null,
    is_active: product.is_active !== false,
    is_featured: Boolean(product.is_featured),
    is_in_stock: product.is_in_stock !== false,
    primary_image_url: product.primary_image_url || product.image || product.images?.[0]?.path || '/images/products/samsung-galaxy-a55.svg',
    current_price: Number(product.current_price ?? product.base_price ?? product.price ?? 0),
    variants: Array.isArray(product.variants) ? product.variants : [],
    images: Array.isArray(product.images) ? product.images : [],
    seo_title: null,
    seo_description: null,
    views_count: 0,
  };

  const rawVariant = item.variant;
  const safeVariant: ProductVariant = {
    id: Number(rawVariant?.id) || Number(safeProduct.id) * 1000 + 1,
    sku: rawVariant?.sku || `SKU-${safeProduct.id}`,
    barcode: rawVariant?.barcode || null,
    color: rawVariant?.color || null,
    size: rawVariant?.size || null,
    price: Number(rawVariant?.price ?? safeProduct.current_price ?? safeProduct.base_price ?? 0),
    cost_price: null,
    stock: Number(rawVariant?.stock) || 100,
    available_stock: Number(rawVariant?.available_stock) || 100,
    is_active: true,
    is_low_stock: false,
    weight_grams: null,
  };

  const cartItemId = item.cartItemId || `item_${safeProduct.id}_${safeVariant.id}_${safeProduct.slug}`;

  return {
    cartItemId,
    product: safeProduct,
    variant: safeVariant,
    quantity: Math.max(1, Number(item.quantity) || 1),
  };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (rawProduct: Product, rawVariant?: ProductVariant, quantity = 1) => {
        if (!rawProduct) return;

        const dummyItem = sanitizeItem({
          product: rawProduct,
          variant: rawVariant,
          quantity,
        });

        if (!dummyItem) return;

        set((state) => {
          const currentItems = (Array.isArray(state.items) ? state.items : [])
            .map(sanitizeItem)
            .filter((it): it is CartItem => it !== null);

          const existingIndex = currentItems.findIndex(
            (it) => it.cartItemId === dummyItem.cartItemId || 
                   (it.variant.id === dummyItem.variant.id && it.product.id === dummyItem.product.id)
          );

          if (existingIndex > -1) {
            const updated = [...currentItems];
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: updated[existingIndex].quantity + Math.max(1, quantity),
            };
            return { items: updated };
          }

          return { items: [...currentItems, dummyItem] };
        });
      },
      removeItem: (identifier: string | number) => {
        set((state) => {
          const currentItems = (Array.isArray(state.items) ? state.items : [])
            .map(sanitizeItem)
            .filter((it): it is CartItem => it !== null);

          const filtered = currentItems.filter((item, idx) => {
            if (item.cartItemId === String(identifier)) return false;
            if (String(item.variant.id) === String(identifier)) return false;
            if (String(item.product.id) === String(identifier)) return false;
            if (String(idx) === String(identifier)) return false;
            return true;
          });

          return { items: filtered };
        });
      },
      updateQuantity: (identifier: string | number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(identifier);
          return;
        }

        set((state) => {
          const currentItems = (Array.isArray(state.items) ? state.items : [])
            .map(sanitizeItem)
            .filter((it): it is CartItem => it !== null);

          const updated = currentItems.map((item, idx) => {
            const isMatch = item.cartItemId === String(identifier) ||
                           String(item.variant.id) === String(identifier) ||
                           String(item.product.id) === String(identifier) ||
                           String(idx) === String(identifier);

            return isMatch ? { ...item, quantity: Math.max(1, quantity) } : item;
          });

          return { items: updated };
        });
      },
      updateVariant: (identifier: string | number, newVariant: ProductVariant) => {
        if (!newVariant) return;

        set((state) => {
          const currentItems = (Array.isArray(state.items) ? state.items : [])
            .map(sanitizeItem)
            .filter((it): it is CartItem => it !== null);

          const targetIdx = currentItems.findIndex((item, idx) => {
            return (
              item.cartItemId === String(identifier) ||
              String(item.variant.id) === String(identifier) ||
              String(idx) === String(identifier)
            );
          });

          if (targetIdx === -1) return { items: currentItems };

          const target = currentItems[targetIdx];
          const newCartItemId = `item_${target.product.id}_${newVariant.id}_${target.product.slug}`;

          // Check if cart already has an item with this new variant for the same product
          const existingIdx = currentItems.findIndex(
            (item, idx) =>
              idx !== targetIdx &&
              (item.cartItemId === newCartItemId ||
                (item.product.id === target.product.id && item.variant.id === newVariant.id))
          );

          if (existingIdx > -1) {
            // Merge quantities and remove the old target
            const updated = [...currentItems];
            updated[existingIdx] = {
              ...updated[existingIdx],
              quantity: updated[existingIdx].quantity + target.quantity,
            };
            updated.splice(targetIdx, 1);
            return { items: updated };
          }

          // Otherwise, update target with new variant
          const updated = [...currentItems];
          updated[targetIdx] = {
            ...target,
            cartItemId: newCartItemId,
            variant: newVariant,
          };
          return { items: updated };
        });
      },
      clearCart: () => {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('cart-storage');
          }
        } catch (e) {}
        set({ items: [] });
      },
      purgeCorruptedItems: () => {
        set((state) => {
          const sanitized = (Array.isArray(state.items) ? state.items : [])
            .map(sanitizeItem)
            .filter((it): it is CartItem => it !== null);
          return { items: sanitized };
        });
      },
      getTotal: () => {
        const items = (Array.isArray(get().items) ? get().items : [])
          .map(sanitizeItem)
          .filter((it): it is CartItem => it !== null);

        return items.reduce((total, item) => {
          const price = Number(item.variant?.price ?? item.product?.current_price ?? item.product?.base_price ?? 0);
          const qty = Number(item.quantity) || 1;
          return total + (isNaN(price) ? 0 : price) * (isNaN(qty) ? 1 : qty);
        }, 0);
      },
      getItemCount: () => {
        const items = (Array.isArray(get().items) ? get().items : [])
          .map(sanitizeItem)
          .filter((it): it is CartItem => it !== null);

        return items.reduce((count, item) => count + (Number(item.quantity) || 0), 0);
      },
    }),
    {
      name: 'cart-storage',
      version: 2,
      migrate: (persistedState: any) => {
        if (!persistedState || !Array.isArray(persistedState.items)) {
          return { items: [] };
        }
        const sanitized = persistedState.items
          .map(sanitizeItem)
          .filter((it: any) => it !== null);
        return { ...persistedState, items: sanitized };
      },
    }
  )
);

interface LocaleState {
  locale: 'en' | 'bn';
  setLocale: (locale: 'en' | 'bn') => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'locale-storage',
    }
  )
);

interface UIState {
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;
  isSidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleSearch: () => void;
  toggleMobileMenu: () => void;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      isCartOpen: false,
      isSearchOpen: false,
      isMobileMenuOpen: false,
      isSidebarOpen: false,
      theme: 'light',
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
      toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      openSidebar: () => set({ isSidebarOpen: true }),
      closeSidebar: () => set({ isSidebarOpen: false }),
      setTheme: (_theme) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('theme', 'light');
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
            document.documentElement.setAttribute('data-theme', 'light');
          } catch (e) {}
        }
        set({ theme: 'light' });
      },
      toggleTheme: () => {
        get().setTheme('light');
      },
    }),
    {
      name: 'ui-storage',
      onRehydrateStorage: () => (state) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('theme', 'light');
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
            document.documentElement.setAttribute('data-theme', 'light');
            if (state) state.theme = 'light';
          } catch (e) {}
        }
      },
    }
  )
);

interface ConfirmedOrderState {
  lastOrder: any | null;
  setLastOrder: (order: any) => void;
  clearLastOrder: () => void;
}

export const useOrderStore = create<ConfirmedOrderState>()(
  persist(
    (set) => ({
      lastOrder: null,
      setLastOrder: (order) => set({ lastOrder: order }),
      clearLastOrder: () => set({ lastOrder: null }),
    }),
    {
      name: 'last-order-storage',
    }
  )
);
