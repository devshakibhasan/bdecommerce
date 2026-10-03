import { useAuthStore } from './store';
import { DataCache } from './dataCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

class ApiClient {
  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isGet = !options.method || options.method.toUpperCase() === 'GET';

    let token = useAuthStore.getState().token;
    if (!token && typeof window !== 'undefined') {
      try {
        token = localStorage.getItem('auth_token');
      } catch (e) {}
    }

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const isPublicGet = isGet && (
      endpoint.startsWith('/products') ||
      endpoint.startsWith('/categories') ||
      endpoint.startsWith('/settings') ||
      endpoint.startsWith('/sliders') ||
      endpoint.startsWith('/cms') ||
      endpoint.startsWith('/content') ||
      endpoint.startsWith('/flash-sales') ||
      endpoint.startsWith('/payment-gateways') ||
      endpoint.startsWith('/size-guides') ||
      endpoint.startsWith('/product-types') ||
      endpoint.startsWith('/brands')
    );

    if (token && !isPublicGet) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Check DataCache for GET requests
    let cachedEntry: ReturnType<typeof DataCache.get> = null;
    if (isGet) {
      cachedEntry = DataCache.get<T>(endpoint);
      if (cachedEntry?.etag) {
        headers['If-None-Match'] = `"${cachedEntry.etag}"`;
      }
      if (cachedEntry?.lastModified) {
        headers['If-Modified-Since'] = cachedEntry.lastModified;
      }
    }

    try {
      let response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'omit',
      });

      if (response.status === 401 && (endpoint.startsWith('/auth/me') || endpoint.startsWith('/admin'))) {
        useAuthStore.getState().logout();
        throw new Error('Unauthorized');
      }

      // Handle 304 Not Modified: Return cached data directly (0 database query overhead)
      if (response.status === 304) {
        if (cachedEntry) return cachedEntry.data as T;
        const fallback = DataCache.get<T>(endpoint);
        if (fallback?.data) return fallback.data as T;
        return (DataCache.getInitialData<T>(endpoint) || {}) as T;
      }

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || `Request failed with status ${response.status}`;
        const errorPayload: any = new Error(errorMsg);
        errorPayload.response = { data, status: response.status };
        if (response.status === 422) {
          errorPayload.name = 'ValidationError';
          errorPayload.errors = data.errors;
        }
        throw errorPayload;
      }

      // On GET: Handle delta updates or store full fresh data in DataCache
      if (isGet) {
        const etag = response.headers.get('ETag') || undefined;
        const lastModified = response.headers.get('Last-Modified') || undefined;

        if (data?.data?.delta === true && cachedEntry && Array.isArray(data?.data?.items)) {
          const merged = DataCache.mergeDelta(endpoint, data.data.items, etag);
          return (merged || data) as T;
        }

        DataCache.set(endpoint, data, etag, lastModified);
      } else {
        // On Mutation: Automatically sync or invalidate affected entity in DataCache
        if (endpoint.includes('/purchases')) {
          DataCache.invalidate('/admin/purchases');
          DataCache.invalidate('/admin/purchases/orders');
          DataCache.invalidate('/admin/purchases/suppliers');
        } else if (endpoint.includes('/orders') || endpoint.includes('/checkout')) {
          DataCache.invalidate('/admin/orders');
          DataCache.invalidate('/customer/orders');
          const resEntity = data?.data?.data || data?.data;
          if (resEntity && typeof resEntity === 'object' && !Array.isArray(resEntity)) {
            DataCache.updateEntity('order', resEntity);
          }
        } else if (endpoint.includes('/products')) {
          DataCache.invalidate('/products');
          const resEntity = data?.data?.data || data?.data;
          if (resEntity && typeof resEntity === 'object' && !Array.isArray(resEntity)) {
            DataCache.updateEntity('product', resEntity);
          }
        } else if (endpoint.includes('/categories')) {
          DataCache.invalidate('/categories');
          const resEntity = data?.data?.data || data?.data;
          if (resEntity && typeof resEntity === 'object' && !Array.isArray(resEntity)) {
            DataCache.updateEntity('category', resEntity);
          }
        } else if (endpoint.includes('/size-guides')) {
          DataCache.invalidate('/size-guides');
        }
      }

      return data as T;
    } catch (error) {
      // If network fails but we have cached data, gracefully return cached data as offline fallback
      if (isGet && cachedEntry) {
        /* silenced */
        return cachedEntry.data as T;
      }
      throw error;
    }
  }

  getCached<T>(endpoint: string): T | null {
    const entry = DataCache.get<T>(endpoint);
    return entry ? (entry.data as T) : null;
  }

  get<T>(endpoint: string, options?: RequestInit) {
    return this.fetch<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: any, options?: RequestInit) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    });
  }

  upload<T>(endpoint: string, formData: FormData, options?: RequestInit) {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    });
  }

  put<T>(endpoint: string, body: any, options?: RequestInit) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body: any, options?: RequestInit) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string, options?: RequestInit) {
    return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Define structured endpoints here (mocking structure)
  auth = {
    login: (data: any) => this.post('/auth/login', data),
    register: (data: any) => this.post('/auth/register', data),
    getMe: () => this.get('/auth/me'),
  };
  
  brands = {
    list: () => this.get('/brands'),
    create: (data: any) => this.post('/admin/brands', data),
    update: (id: number, data: any) => {
      if (typeof FormData !== 'undefined' && data instanceof FormData) {
        if (!data.has('_method')) data.append('_method', 'PUT');
        return this.post(`/admin/brands/${id}`, data);
      }
      return this.put(`/admin/brands/${id}`, data);
    },
    delete: (id: number) => this.delete(`/admin/brands/${id}`),
  };

  productTypes = {
    list: () => this.get('/admin/product-types'),
    create: (data: any) => this.post('/admin/product-types', data),
    update: (id: number, data: any) => this.put(`/admin/product-types/${id}`, data),
    delete: (id: number) => this.delete(`/admin/product-types/${id}`),
  };

  categories = {
    list: () => this.get('/categories'),
    create: (data: any) => this.post('/admin/categories', data),
    update: (id: number, data: any) => this.put(`/admin/categories/${id}`, data),
    delete: (id: number) => this.delete(`/admin/categories/${id}`),
  };

  products = {
    list: (params: string = '') => this.get(`/products${params}`),
    show: (slug: string) => this.get(`/products/${slug}`),
  };

  sizeGuides = {
    list: () => this.get('/admin/size-guides'),
    get: (id: number) => this.get(`/admin/size-guides/${id}`),
    create: (data: any) => this.post('/admin/size-guides', data),
    update: (id: number, data: any) => this.put(`/admin/size-guides/${id}`, data),
    delete: (id: number) => this.delete(`/admin/size-guides/${id}`),
  };
}

export const api = new ApiClient();
