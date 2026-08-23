"use client";

import { Alert, AlertDescription, AlertTitle } from "@personal-os/ui/components/alert";
import { Button } from "@personal-os/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@personal-os/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@personal-os/ui/components/field";
import { Input } from "@personal-os/ui/components/input";
import { Spinner } from "@personal-os/ui/components/spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as api from "@/lib/api-client";
import { buildAuthRedirectUrl } from "@/modules/auth/lib/dev-auth-code";

export function ForgotPasswordForm() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setError(null);
		setSubmitting(true);
		try {
			const result = await api.forgotPassword(email);
			router.push(buildAuthRedirectUrl("/reset-password", email, result.developmentCode));
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Request failed");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Card className="rounded-[16px] border border-dashboard-border bg-dashboard-surface ring-0">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">Forgot your password?</CardTitle>
				<CardDescription>We will send a reset code if an account exists.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit}>
					<FieldGroup>
						{error ? (
							<Alert variant="destructive">
								<AlertTitle>Request failed</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						) : null}
						<Field>
							<FieldLabel htmlFor="recovery-email">Email</FieldLabel>
							<Input
								id="recovery-email"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								autoComplete="email"
								required
							/>
						</Field>
						<Button type="submit" disabled={submitting}>
							{submitting ? <Spinner data-icon="inline-start" /> : null}
							Send reset code
						</Button>
						<p className="text-muted-foreground text-center text-sm">
							<Link href="/login" className="underline underline-offset-4">
								Back to sign in
							</Link>
						</p>
					</FieldGroup>
				</form>
			</CardContent>
		</Card>
	);
}
