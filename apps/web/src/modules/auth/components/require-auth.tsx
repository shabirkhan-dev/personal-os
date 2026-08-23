"use client";

import { Spinner } from "@personal-os/ui/components/spinner";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useAuth } from "@/context/auth-context";

export function RequireAuth({ children }: { children: ReactNode }) {
	const router = useRouter();
	const { user, loading } = useAuth();

	useEffect(() => {
		if (!loading && !user) {
			router.replace("/login");
		}
	}, [loading, router, user]);

	if (loading || !user) {
		return (
			<div
				className="flex min-h-svh items-center justify-center"
				aria-busy="true"
				suppressHydrationWarning
			>
				<Spinner className="size-6" />
			</div>
		);
	}

	return children;
}
