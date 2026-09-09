import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/skeleton";

/**
 * Custom hook for data fetching with loading states
 */
export function useLoading<T>(fetchFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    isLoading,
    error,
    mutate: fetchData,
    reset: () => setData(null),
  };
}

/**
 * Component for displaying loading state with data
 */
export function LoadingWithData<T>({
  data,
  children: content,
}: {
  data: T | null;
  children: React.ReactNode;
}) {
  if (data === null) {
    return <LoadingSpinner />
  }

  return content;
}