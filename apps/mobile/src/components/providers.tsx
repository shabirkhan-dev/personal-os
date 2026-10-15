import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { SyncProvider } from "@/lib/sync/sync-provider";
import { AuthProvider } from "@/modules/auth";

export function AppProviders({ children }: { children: ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: { retry: 1, staleTime: 30_000 },
					mutations: { retry: 0 },
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<SyncProvider>{children}</SyncProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}
