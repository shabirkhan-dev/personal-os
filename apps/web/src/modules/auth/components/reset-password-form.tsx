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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@personal-os/ui/components/field";
import { Input } from "@personal-os/ui/components/input";
import { Spinner } from "@personal-os/ui/components/spinner";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import * as api from "@/lib/api-client";
import { readDevCodeFromSearchParams } from "@/modules/auth/lib/dev-auth-code";

export function ResetPasswordForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [email, setEmail] = useState(searchParams.get("email") ?? "");
	const [code, setCode] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [developmentCode, setDevelopmentCode] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		setDevelopmentCode(readDevCodeFromSearchParams(searchParams));
	}, [searchParams]);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setError(null);
		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}
		setSubmitting(true);
		try {
			await api.resetPassword({ email, code, newPassword: password });
			router.push("/login?reset=true");
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Password reset failed");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Card className="rounded-[16px] border border-dashboard-border bg-dashboard-surface ring-0">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">Reset your password</CardTitle>
				<CardDescription>Enter your reset code and choose a new password.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit}>
					<FieldGroup>
						{developmentCode ? (
							<Alert>
								<AlertTitle>Development code</AlertTitle>
								<AlertDescription className="font-mono text-base">
									{developmentCode}
								</AlertDescription>
							</Alert>
						) : null}
						{error ? (
							<Alert variant="destructive">
								<AlertTitle>Could not reset password</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						) : null}
						<Field>
							<FieldLabel htmlFor="reset-email">Email</FieldLabel>
							<Input
								id="reset-email"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								autoComplete="email"
								required
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="reset-code">Reset code</FieldLabel>
							<Input
								id="reset-code"
								inputMode="numeric"
								pattern="[0-9]{6}"
								maxLength={6}
								value={code}
								onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
								autoComplete="one-time-code"
								required
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="reset-password">New password</FieldLabel>
							<Input
								id="reset-password"
								type="password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								minLength={12}
								maxLength={128}
								autoComplete="new-password"
								required
							/>
							<FieldDescription>Use at least 12 characters.</FieldDescription>
						</Field>
						<Field>
							<FieldLabel htmlFor="reset-confirm-password">Confirm new password</FieldLabel>
							<Input
								id="reset-confirm-password"
								type="password"
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
								minLength={12}
								maxLength={128}
								autoComplete="new-password"
								required
							/>
						</Field>
						<Button type="submit" disabled={submitting}>
							{submitting ? <Spinner data-icon="inline-start" /> : null}
							Reset password
						</Button>
					</FieldGroup>
				</form>
			</CardContent>
		</Card>
	);
}
