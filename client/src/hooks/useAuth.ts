import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import type { User } from "@shared/schema";

export function useAuth() {
  const { address, isConnected } = useAccount();

  const { data: user, isLoading, refetch, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user", address],
    queryFn: async () => {
      if (!address || !isConnected) {
        return null;
      }
      
      try {
        const response = await fetch("/api/auth/user", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        
        return response.json();
      } catch (err) {
        console.error('Error fetching user:', err);
        return null;
      }
    },
    enabled: !!address && isConnected,
    retry: 2, // Changed: Retry 2 times
    retryDelay: 500, // Wait 500ms between retries
    staleTime: 30000, // Changed: Cache for 30 seconds
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true, // Added: Always refetch on mount
  });

  return {
    user,
    isLoading: isLoading || (!user && !!address && isConnected), // Changed: Still loading if wallet connected but no user yet
    isAuthenticated: !!user && !!address && isConnected,
    address,
    refetch,
    error,
  };
}