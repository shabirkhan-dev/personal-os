"use client";

import { type FormEvent, useState } from "react";
import styles from "../landing.module.css";

type Status =
	| { kind: "idle" }
	| { kind: "sending" }
	| { kind: "done" }
	| { kind: "error"; message: string };

/** Same shape the mobile app accepts; linear, so no backtracking on long input. */
const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
const MAX_EMAIL_LENGTH = 320;

/** Launch-day sign-up. Posts to the Cloudflare Pages Function at `/api/notify`. */
export function NotifyForm() {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<Status>({ kind: "idle" });

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const value = email.trim();
		if (value.length > MAX_EMAIL_LENGTH || !EMAIL.test(value)) {
			setStatus({ kind: "error", message: "Enter a valid email address." });
			return;
		}
		setStatus({ kind: "sending" });
		try {
			const response = await fetch("/api/notify", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ email: value }),
			});
			if (!response.ok) throw new Error(`notify responded ${response.status}`);
			setEmail("");
			setStatus({ kind: "done" });
		} catch (error) {
			console.error("Launch sign-up failed", error);
			setStatus({
				kind: "error",
				message: "We couldn’t save your email right now. Please try again in a moment.",
			});
		}
	}

	if (status.kind === "done") {
		return (
			<p className={styles.formDone} role="status">
				You’re on the list. We’ll email you the day it lands.
			</p>
		);
	}

	return (
		<form className={styles.form} onSubmit={submit} noValidate>
			<label htmlFor="notify-email" className={styles.visuallyHidden}>
				Email address
			</label>
			<input
				id="notify-email"
				className={styles.formInput}
				type="email"
				inputMode="email"
				autoComplete="email"
				placeholder="you@email.com"
				value={email}
				onChange={(event) => setEmail(event.target.value)}
				aria-invalid={status.kind === "error"}
				aria-describedby="notify-status"
				required
			/>
			<button
				type="submit"
				className={`${styles.pill} ${styles.pillDark} ${styles.formButton}`}
				disabled={status.kind === "sending"}
			>
				{status.kind === "sending" ? "Saving…" : "Notify me"}
			</button>
			<p id="notify-status" className={styles.formError} aria-live="polite">
				{status.kind === "error" ? status.message : ""}
			</p>
		</form>
	);
}
