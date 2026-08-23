import { Mail01Icon, ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@personal-os/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@personal-os/ui/components/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@personal-os/ui/components/input-group";
import { Spinner } from "@personal-os/ui/components/spinner";
import Link from "next/link";

interface LoginCredentialsFormProps {
	email: string;
	password: string;
	showPassword: boolean;
	pending: boolean;
	onEmailChange: (value: string) => void;
	onPasswordChange: (value: string) => void;
	onTogglePassword: () => void;
	onSubmit: (event: React.FormEvent) => void;
}

export function LoginCredentialsForm(props: LoginCredentialsFormProps) {
	return (
		<form onSubmit={props.onSubmit}>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="email">Email</FieldLabel>
					<InputGroup>
						<InputGroupAddon>
							<HugeiconsIcon icon={Mail01Icon} strokeWidth={2} />
						</InputGroupAddon>
						<InputGroupInput
							id="email"
							type="email"
							placeholder="you@example.com"
							value={props.email}
							onChange={(event) => props.onEmailChange(event.target.value)}
							required
							autoComplete="email webauthn"
							disabled={props.pending}
						/>
					</InputGroup>
				</Field>
				<Field>
					<div className="flex items-center justify-between gap-2">
						<FieldLabel htmlFor="password">Password</FieldLabel>
						<Link href="/forgot-password" className="text-muted-foreground text-sm hover:underline">
							Forgot password?
						</Link>
					</div>
					<InputGroup>
						<InputGroupInput
							id="password"
							type={props.showPassword ? "text" : "password"}
							value={props.password}
							onChange={(event) => props.onPasswordChange(event.target.value)}
							required
							autoComplete="current-password"
							disabled={props.pending}
						/>
						<InputGroupAddon align="inline-end">
							<InputGroupButton
								size="icon-xs"
								aria-label={props.showPassword ? "Hide password" : "Show password"}
								onClick={props.onTogglePassword}
							>
								<HugeiconsIcon
									icon={props.showPassword ? ViewOffSlashIcon : ViewIcon}
									strokeWidth={2}
								/>
							</InputGroupButton>
						</InputGroupAddon>
					</InputGroup>
				</Field>
				<Button type="submit" className="w-full" disabled={props.pending}>
					{props.pending ? <Spinner data-icon="inline-start" /> : null}
					{props.pending ? "Signing in..." : "Sign in"}
				</Button>
			</FieldGroup>
		</form>
	);
}
