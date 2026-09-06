import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/skeleton";

interface UseLoadingResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  mutate: () => Promise<void>;
  reset: () => void;
}

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
  loadingText = "در حال بارگذاری...",
  errorText = "خطایی رخ داد. لطفاً دوباره تلاش کنید.",
  children: content,
}: {
  data: T | null;
  children: React.ReactNode;
  loadingText?: string;
  errorText?: string;
}) {
  if (data === null) {
    return <LoadingSpinner />
  }

  return content;
}