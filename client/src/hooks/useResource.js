import { useCallback, useEffect, useMemo } from 'react';
import api from '../api/axios';
import useStore from '../store';

const normalizePayload = (responseData) => {
  if (!responseData) {
    return [];
  }

  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (typeof responseData === 'object') {
    if (Array.isArray(responseData.items)) {
      return responseData.items;
    }
    if (Array.isArray(responseData.results)) {
      return responseData.results;
    }
  }

  return responseData;
};

const useResource = (key, endpoint, options = {}) => {
  const {
    auto = true,
    params,
    transform,
    watch = [],
  } = options;

  const data = useStore((state) => state.entities[key]);
  const loading = useStore((state) => state.loading[key]);
  const error = useStore((state) => state.errors[key]);
  const updateEntities = useStore((state) => state.updateEntities);
  const setLoading = useStore((state) => state.setLoading);
  const setError = useStore((state) => state.setError);

  const serializedParams = useMemo(() => JSON.stringify(params || {}), [params]);
  const stableParams = useMemo(() => {
    if (!params) {
      return undefined;
    }
    if (Array.isArray(params)) {
      return [...params];
    }
    if (typeof params === 'object') {
      return { ...params };
    }
    return params;
  }, [serializedParams]);

  const fetchData = useCallback(async () => {
    setLoading(key, true);
    setError(key, null);
    try {
      const response = await api.get(endpoint, {
        params: stableParams,
      });
      const normalized = normalizePayload(response?.data);
      const mapped = transform ? transform(normalized, response?.data) : normalized;
      updateEntities(key, mapped ?? []);
      return mapped;
    } catch (err) {
      console.error(`Failed to fetch ${key}`, err);
      setError(key, err?.message || 'Unable to load data');
      throw err;
    } finally {
      setLoading(key, false);
    }
  }, [endpoint, key, serializedParams, setError, setLoading, stableParams, transform, updateEntities]);

  useEffect(() => {
    if (!auto) {
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, auto, serializedParams, ...watch]);

  return {
    data,
    loading: Boolean(loading),
    error,
    refetch: fetchData,
  };
};

export default useResource;
