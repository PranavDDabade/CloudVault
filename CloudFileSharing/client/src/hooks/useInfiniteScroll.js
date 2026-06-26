import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useInfiniteScroll — loads more items when sentinel element is visible
 */
export const useInfiniteScroll = ({ fetchMore, hasMore, loading }) => {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchMore, hasMore, loading]);

  return sentinelRef;
};

/**
 * useInfiniteFiles — infinite scroll for file lists
 */
export const useInfiniteFiles = (fetchFn, params = {}) => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const load = useCallback(async (pageNum, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await fetchFn({ ...params, page: pageNum, limit: 20 });
      const newItems = data.files || data.items || [];
      setItems((prev) => reset ? newItems : [...prev, ...newItems]);
      setHasMore(data.pagination?.hasNextPage || false);
      setPage(pageNum);
    } catch (_) {}
    finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [fetchFn, JSON.stringify(params)]);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);
    load(1, true);
  }, [JSON.stringify(params)]);

  const fetchMore = useCallback(() => {
    if (hasMore && !loading) load(page + 1);
  }, [hasMore, loading, page, load]);

  const refresh = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    load(1, true);
  }, [load]);

  return { items, loading, initialLoading, hasMore, fetchMore, refresh, setItems };
};
