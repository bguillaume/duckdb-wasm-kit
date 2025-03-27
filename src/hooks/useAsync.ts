import { useEffect, useState } from "react";

type AsyncFunction<T> = () => Promise<T>;

interface UseAsyncResult<T> {
  loading: boolean;
  error: Error | undefined;
  data: T | undefined;
}

function useAsync<T>(fn: AsyncFunction<T>, deps: any[] = []): UseAsyncResult<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [data, setData] = useState<T | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(undefined);
      try {
        const result = await fn();
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, deps);

  return { loading, error, data };
}

export default useAsync;
