"use client";

import { ToastProvider } from "@personal-os/ui/components/toaster";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme";
import { AuthProvider } from "@/modules/auth/context";
import { QueryProvider } from "./providers/query-provider";

export function Providers({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider>
			<QueryProvider>
				<AuthProvider>
					<ToastProvider>{children}</ToastProvider>
				</AuthProvider>
			</QueryProvider>
		</ThemeProvider>
	);
}
