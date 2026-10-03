import { QueryClient } from '@tanstack/react-query';
import { DataCache } from './dataCache';

export type CacheEntityType = 'product' | 'category' | 'order' | 'customer';

/**
 * Update ONLY a specific modified entity in all matching React Query caches and persistent DataCache.
 * Ensures that unchanged items are NOT reloaded or refetched from the database.
 */
export function syncEntityInCache(
  queryClient: QueryClient,
  entityType: CacheEntityType,
  updatedEntity: any
): void {
  if (!updatedEntity || typeof updatedEntity !== 'object') return;

  const targetId = updatedEntity.id;
  const targetSlug = updatedEntity.slug;

  // 1. Sync in persistent DataCache
  if (entityType === 'product' || entityType === 'category' || entityType === 'order') {
    DataCache.updateEntity(entityType, updatedEntity);
  }

  // 2. Sync inside React Query queries
  // Find all queries whose queryKey matches this entity type
  const queries = queryClient.getQueryCache().getAll();

  queries.forEach((query) => {
    const key = query.queryKey;
    const firstKey = String(key[0] || '');

    // Single item query match strictly by entity type (e.g. ['product-detail', slug], ['admin-order-detail', id])
    const isSingleMatch =
      (entityType === 'product' && (firstKey.includes('product') || firstKey.includes('catalog'))) ||
      (entityType === 'order' && (firstKey.includes('order'))) ||
      (entityType === 'category' && (firstKey.includes('categor'))) ||
      (entityType === 'customer' && (firstKey.includes('customer')));

    if (isSingleMatch && key.length > 1) {
      const secondKey = key[1];
      if (
        secondKey !== undefined &&
        (secondKey === targetId || String(secondKey) === String(targetId) || (targetSlug && secondKey === targetSlug))
      ) {
        queryClient.setQueryData(key, (old: any) => {
          if (!old) return updatedEntity;
          return { ...old, ...updatedEntity };
        });
        return;
      }
    }

    // List query match (e.g. ['products-catalog-all'], ['admin-products'], ['admin-categories'])
    const isRelevantList =
      (entityType === 'product' && (firstKey.includes('product') || firstKey.includes('inventory'))) ||
      (entityType === 'category' && firstKey.includes('categor')) ||
      (entityType === 'order' && (firstKey.includes('order') || firstKey.includes('customer-order')));

    if (isRelevantList) {
      queryClient.setQueryData(key, (oldData: any) => {
        if (!oldData) return oldData;

        // Case A: Array of items
        if (Array.isArray(oldData)) {
          return oldData.map((item) =>
            (item?.id === targetId || (targetSlug && item?.slug === targetSlug))
              ? { ...item, ...updatedEntity }
              : item
          );
        }

        // Case B: Nested items array { items: [...] }
        if (oldData.items && Array.isArray(oldData.items)) {
          const updatedItems = oldData.items.map((item: any) =>
            (item?.id === targetId || (targetSlug && item?.slug === targetSlug))
              ? { ...item, ...updatedEntity }
              : item
          );
          return {
            ...oldData,
            items: updatedItems,
            data: updatedItems,
          };
        }

        // Case C: Nested data array { data: [...] }
        if (oldData.data && Array.isArray(oldData.data)) {
          const updatedItems = oldData.data.map((item: any) =>
            (item?.id === targetId || (targetSlug && item?.slug === targetSlug))
              ? { ...item, ...updatedEntity }
              : item
          );
          return {
            ...oldData,
            data: updatedItems,
            items: updatedItems,
          };
        }

        return oldData;
      });
    }
  });
}

/**
 * Add a newly created entity to cached lists without refetching from the database.
 */
export function addEntityToCache(
  queryClient: QueryClient,
  entityType: CacheEntityType,
  newEntity: any
): void {
  if (!newEntity || typeof newEntity !== 'object') return;

  const queries = queryClient.getQueryCache().getAll();

  queries.forEach((query) => {
    const key = query.queryKey;
    const firstKey = String(key[0] || '');

    const isRelevantList =
      (entityType === 'product' && (firstKey.includes('product') || firstKey.includes('inventory'))) ||
      (entityType === 'category' && firstKey.includes('categor')) ||
      (entityType === 'order' && (firstKey.includes('order') || firstKey.includes('customer-order')));

    if (isRelevantList) {
      queryClient.setQueryData(key, (oldData: any) => {
        if (!oldData) return oldData;

        if (Array.isArray(oldData)) {
          return [newEntity, ...oldData.filter((it) => it?.id !== newEntity.id)];
        }

        if (oldData.items && Array.isArray(oldData.items)) {
          const updated = [newEntity, ...oldData.items.filter((it: any) => it?.id !== newEntity.id)];
          return {
            ...oldData,
            items: updated,
            data: updated,
            pagination: oldData.pagination
              ? { ...oldData.pagination, total: (oldData.pagination.total || 0) + 1, count: updated.length }
              : undefined,
          };
        }

        if (oldData.data && Array.isArray(oldData.data)) {
          const updated = [newEntity, ...oldData.data.filter((it: any) => it?.id !== newEntity.id)];
          return {
            ...oldData,
            data: updated,
            items: updated,
          };
        }

        return oldData;
      });
    }
  });
}

/**
 * Remove an entity from cached lists without refetching from the database.
 */
export function removeEntityFromCache(
  queryClient: QueryClient,
  entityType: CacheEntityType,
  id: number | string
): void {
  const queries = queryClient.getQueryCache().getAll();

  queries.forEach((query) => {
    const key = query.queryKey;
    const firstKey = String(key[0] || '');

    const isRelevantList =
      (entityType === 'product' && (firstKey.includes('product') || firstKey.includes('inventory'))) ||
      (entityType === 'category' && firstKey.includes('categor')) ||
      (entityType === 'order' && (firstKey.includes('order') || firstKey.includes('customer-order')));

    if (isRelevantList) {
      queryClient.setQueryData(key, (oldData: any) => {
        if (!oldData) return oldData;

        if (Array.isArray(oldData)) {
          return oldData.filter((it) => it?.id !== id && String(it?.id) !== String(id));
        }

        if (oldData.items && Array.isArray(oldData.items)) {
          const updated = oldData.items.filter((it: any) => it?.id !== id && String(it?.id) !== String(id));
          return {
            ...oldData,
            items: updated,
            data: updated,
            pagination: oldData.pagination
              ? { ...oldData.pagination, total: Math.max(0, (oldData.pagination.total || 1) - 1), count: updated.length }
              : undefined,
          };
        }

        if (oldData.data && Array.isArray(oldData.data)) {
          const updated = oldData.data.filter((it: any) => it?.id !== id && String(it?.id) !== String(id));
          return {
            ...oldData,
            data: updated,
            items: updated,
          };
        }

        return oldData;
      });
    }
  });
}
