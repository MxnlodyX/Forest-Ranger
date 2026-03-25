import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Generic data-fetching hook.
 * @param {() => Promise<any>} fetcher - Async function that returns data.
 * @param {any[]} deps - Re-run when these change (optional).
 */
export function useApi(fetcher, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const depsKey = useMemo(() => JSON.stringify(deps), [deps]);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    execute();
  }, [execute, depsKey]);

  return { data, loading, error, refetch: execute };
}
