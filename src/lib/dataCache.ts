/**
 * Persistent and Memory Data Cache Engine
 * Provides sub-millisecond data retrieval, ETag tracking, and delta update merging.
 * Ensures data once loaded from the database is never redundantly refetched.
 */

interface CacheEntry<T = any> {
  data: T;
  etag?: string;
  lastModified?: string;
  timestamp: number;
}

const MEMORY_CACHE = new Map<string, CacheEntry>();
const STORAGE_PREFIX = 'bd_data_cache_v12_';
const MAX_PERSIST_BYTES = 5 * 1024 * 1024; // 5MB safe limit

// Auto-purge outdated legacy cache keys on initial client load
if (typeof window !== 'undefined') {
  try {
    [sessionStorage, localStorage].forEach(storage => {
      for (let i = storage.length - 1; i >= 0; i--) {
        const key = storage.key(i);
        if (key && key.startsWith('bd_data_cache_') && !key.startsWith(STORAGE_PREFIX)) {
          storage.removeItem(key);
        }
      }
    });
  } catch (e) {}
}

// Endpoints that should be persisted across page refreshes and tab switches
const PERSISTENT_ENDPOINTS = [
  '/categories',
  '/products',
  '/cms/pages/homepage',
  '/content/homepage',
  '/settings',
  '/content/settings',
  '/customer/orders-lookup',
  '/customer/orders',
  '/size-guides',
  '/product-types',
  '/brands',
];

function shouldPersist(endpoint: string): boolean {
  return PERSISTENT_ENDPOINTS.some((prefix) => endpoint.startsWith(prefix));
}

function getStorageKey(endpoint: string): string {
  return `${STORAGE_PREFIX}${endpoint}`;
}

export class DataCache {
  /**
   * Synchronously retrieve cached data if available (instant 0ms render)
   */
  static get<T = any>(endpoint: string): CacheEntry<T> | null {
    // 1. Check memory cache first (0ms)
    if (MEMORY_CACHE.has(endpoint)) {
      return MEMORY_CACHE.get(endpoint) as CacheEntry<T>;
    }

    // 2. Check browser storage
    if (typeof window !== 'undefined' && shouldPersist(endpoint)) {
      try {
        const stored = sessionStorage.getItem(getStorageKey(endpoint)) || localStorage.getItem(getStorageKey(endpoint));
        if (stored) {
          if (stored.includes('__PHP_Incomplete_Class_Name')) {
            sessionStorage.removeItem(getStorageKey(endpoint));
            localStorage.removeItem(getStorageKey(endpoint));
            return null;
          }
          const parsed = JSON.parse(stored) as CacheEntry<T>;
          // Re-populate memory cache
          MEMORY_CACHE.set(endpoint, parsed);
          return parsed;
        }
      } catch (err) {
        /* silenced */
      }
    }

    return null;
  }

  /**
   * Instant 0ms initialData resolver for React Query / page components.
   * Resolves cached data directly from browser storage on initial page load / refresh.
   * Unwraps envelopes so it always returns the exact data payload expected by queries.
   */
  static getInitialData<T = any>(endpoint: string): T | undefined {
    const entry = this.get<T>(endpoint);
    if (!entry || !entry.data) return undefined;
    const d: any = entry.data;

    // 1. Direct array
    if (Array.isArray(d)) return d as T;

    // 2. Nested list in Laravel paginated payload: { data: { items: [...] } } or { data: { data: [...] } }
    if (Array.isArray(d?.data?.items)) return d.data.items as T;
    if (Array.isArray(d?.data?.data)) return d.data.data as T;

    // 3. Top-level items or data array: { items: [...] } or { data: [...] }
    if (Array.isArray(d?.items)) return d.items as T;
    if (Array.isArray(d?.data)) return d.data as T;

    // Collection endpoint defense: guarantee array return type
    const isCollection = endpoint.startsWith('/products') || 
                         endpoint.startsWith('/categories') || 
                         endpoint.startsWith('/customer/orders') || 
                         endpoint.startsWith('/flash-sales');

    if (isCollection) {
      if (typeof d === 'object' && d !== null) {
        for (const key of Object.keys(d)) {
          if (Array.isArray(d[key])) return d[key] as T;
          if (typeof d[key] === 'object' && d[key] !== null) {
            for (const subKey of Object.keys(d[key])) {
              if (Array.isArray(d[key][subKey])) return d[key][subKey] as T;
            }
          }
        }
      }
      return undefined;
    }

    // 4. Single entity payload: { data: { ... } } (e.g., settings, page)
    if (d?.data !== undefined && d?.success !== undefined) {
      return d.data as T;
    }

    return d as T;
  }

  /**
   * Save fresh data along with ETag and timestamp
   */
  static set<T = any>(endpoint: string, data: T, etag?: string, lastModified?: string): void {
    const entry: CacheEntry<T> = {
      data,
      etag: etag ? etag.trim().replace(/^W\//i, '').replace(/^"|"$/g, '') : undefined,
      lastModified: lastModified || new Date().toISOString(),
      timestamp: Date.now(),
    };

    // Store in memory
    MEMORY_CACHE.set(endpoint, entry);

    // Persist to browser storage if applicable
    if (typeof window !== 'undefined' && shouldPersist(endpoint)) {
      try {
        const serialized = JSON.stringify(entry);
        if (serialized.length < MAX_PERSIST_BYTES) {
          sessionStorage.setItem(getStorageKey(endpoint), serialized);
        }
      } catch (err) {
        // Quota exceeded: clean old entries
        try {
          this.cleanupStorage();
          sessionStorage.setItem(getStorageKey(endpoint), JSON.stringify(entry));
        } catch (e) {}
      }
    }
  }

  /**
   * Merge delta (updated/new) items into an existing cached collection
   * When the database returns only changed items, this merges them cleanly by ID.
   */
  static mergeDelta(endpoint: string, deltaItems: any[], newEtag?: string): any {
    const current = this.get(endpoint);
    if (!current || !current.data) {
      return null;
    }

    let currentItems: any[] = [];
    let isNested = false;

    if (Array.isArray(current.data)) {
      currentItems = [...current.data];
    } else if (Array.isArray(current.data?.items)) {
      currentItems = [...current.data.items];
      isNested = true;
    } else if (Array.isArray(current.data?.data)) {
      currentItems = [...current.data.data];
      isNested = true;
    } else if (Array.isArray(current.data?.data?.items)) {
      currentItems = [...current.data.data.items];
      isNested = true;
    }

    if (currentItems.length === 0) {
      return current.data;
    }

    // Merge each delta item: if exists, replace; if new, prepend
    for (const delta of deltaItems) {
      if (!delta || typeof delta !== 'object') continue;
      const targetId = delta.id ?? delta.slug;
      const index = currentItems.findIndex((item) => (item?.id ?? item?.slug) === targetId);

      if (index !== -1) {
        currentItems[index] = { ...currentItems[index], ...delta };
      } else {
        currentItems.unshift(delta);
      }
    }

    // Reconstruct cache data structure
    let updatedData: any;
    if (isNested) {
      updatedData = {
        ...current.data,
        items: currentItems,
        data: currentItems,
        pagination: current.data.pagination ? {
          ...current.data.pagination,
          count: currentItems.length,
        } : undefined,
      };
    } else {
      updatedData = currentItems;
    }

    this.set(endpoint, updatedData, newEtag || current.etag, new Date().toISOString());
    return updatedData;
  }

  /**
   * Update a specific single entity in all cached endpoints
   */
  static updateEntity(entityType: 'product' | 'category' | 'order', entity: any): void {
    if (!entity || typeof entity !== 'object') return;
    const targetId = entity.id;
    const targetSlug = entity.slug;

    // Iterate through memory cache and update matching entities ONLY for corresponding endpoints
    for (const [endpoint, entry] of MEMORY_CACHE.entries()) {
      if (!entry.data) continue;

      const isMatchingEndpoint =
        (entityType === 'product' && (endpoint.startsWith('/products') || endpoint.startsWith('/admin/products') || endpoint.startsWith('/flash-sales'))) ||
        (entityType === 'order' && (endpoint.startsWith('/orders') || endpoint.startsWith('/admin/orders') || endpoint.startsWith('/customer/orders'))) ||
        (entityType === 'category' && (endpoint.startsWith('/categories') || endpoint.startsWith('/admin/categories')));

      if (!isMatchingEndpoint) continue;

      let modified = false;
      let items: any[] = [];

      if (Array.isArray(entry.data)) {
        items = entry.data;
      } else if (entry.data?.items && Array.isArray(entry.data.items)) {
        items = entry.data.items;
      } else if (entry.data?.data && Array.isArray(entry.data.data)) {
        items = entry.data.data;
      } else if (entry.data?.data?.items && Array.isArray(entry.data.data.items)) {
        items = entry.data.data.items;
      } else if (entry.data?.data?.data && Array.isArray(entry.data.data.data)) {
        items = entry.data.data.data;
      } else if ((entry.data.id === targetId || (targetSlug && entry.data.slug === targetSlug))) {
        // Single entity endpoint (e.g. /products/slug)
        entry.data = { ...entry.data, ...entity };
        entry.timestamp = Date.now();
        this.set(endpoint, entry.data, entry.etag);
        continue;
      }

      if (items.length > 0) {
        const index = items.findIndex((it) => it && (it.id === targetId || (targetSlug && it.slug === targetSlug)));
        if (index !== -1) {
          items[index] = { ...items[index], ...entity };
          modified = true;
        }
      }

      if (modified) {
        this.set(endpoint, entry.data, entry.etag);
      }
    }
  }

  /**
   * Invalidate a specific endpoint or prefix
   */
  static invalidate(endpointOrPrefix: string): void {
    for (const key of MEMORY_CACHE.keys()) {
      if (key.startsWith(endpointOrPrefix)) {
        MEMORY_CACHE.delete(key);
      }
    }
    if (typeof window !== 'undefined') {
      try {
        const targetPrefix = `${STORAGE_PREFIX}${endpointOrPrefix}`;
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith(targetPrefix)) {
            sessionStorage.removeItem(k);
          }
        }
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith(targetPrefix)) {
            localStorage.removeItem(k);
          }
        }
      } catch (e) {}
    }
  }

  /**
   * Remove old storage entries to free up space
   */
  private static cleanupStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch (e) {}
  }
}
