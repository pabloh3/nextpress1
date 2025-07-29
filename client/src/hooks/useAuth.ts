import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    queryFn: async () => {
      const res = await fetch("/api/auth/user", {
        credentials: "include",
      });
      if (res.status === 401) {
        return null;
      }
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refetch,
  };
}
