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
    retry: false,
    staleTime: 5000, // Cache for 5 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus to prevent loops
    refetchOnReconnect: true,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !!address && isConnected,
    address,
    refetch,
    error,
  };
}
