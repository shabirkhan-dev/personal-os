import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { usePoTheme } from "@/theme";
import { recordNudge } from "../data/career-actions";
import { daysBetween, lastEvent } from "../lib/career-math";
import type { Application, Story } from "../lib/career-model";
import { CareerAiError, type Tone, useCareerAi } from "../services/career-ai";
import { FilterChip, Footer, ListRow } from "./career-ui";
import { FieldGroup, FieldRow, TextBox } from "./field-rows";

const TONES: ReadonlyArray<{ id: Tone; label: string }> = [
	{ id: "as-is", label: "As is" },
	{ id: "shorter", label: "Shorter" },
	{ id: "warmer", label: "Warmer" },
	{ id: "formal", label: "More formal" },
];

export type NudgeSheetProps = {
	visible: boolean;
	app: Application;
	stories: readonly Story[];
	senderName: string;
	onClose: () => void;
	onSent: () => void;
};

/**
 * The AI drafts a short follow-up from the application notes and the person's stories; they edit
 * it, pick a tone, then copy it or open it in their email app. Nothing is sent from the app.
 */
export function NudgeSheet({
	visible,
	app,
	stories,
	senderName,
	onClose,
	onSent,
}: NudgeSheetProps) {
	const { colors } = usePoTheme();
	const ai = useCareerAi();
	const [subject, setSubject] = useState(`Following up: ${app.role || app.company}`);
	const [body, setBody] = useState("");
	const [tone, setTone] = useState<Tone>("as-is");
	const [drafting, setDrafting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [contactName, setContactName] = useState(app.contact?.name ?? "");
	const [email, setEmail] = useState(app.contact?.email ?? "");
	const request = useRef(0);

	const applied = lastEvent(app, "applied");
	const draft = useCallback(
		async (nextTone: Tone, currentDraft?: string) => {
			const id = ++request.current;
			setDrafting(true);
			setError(null);
			try {
				const result = await ai.draftNudge({
					senderName,
					company: app.company,
					role: app.role,
					contactName: app.contact?.name ?? "",
					daysSinceApplied: applied ? daysBetween(applied, new Date()) : 7,
					notes: app.notes,
					stories,
					tone: nextTone,
					currentDraft,
				});
				if (id !== request.current) return;
				setSubject(result.subject);
				setBody(result.body);
			} catch (caught) {
				if (id !== request.current) return;
				setError(
					caught instanceof CareerAiError
						? caught.message
						: "Couldn't draft it. Write it yourself.",
				);
			} finally {
				if (id === request.current) setDrafting(false);
			}
		},
		[ai, app, applied, senderName, stories],
	);

	const first = useRef(true);
	useEffect(() => {
		if (!visible || !first.current) return;
		first.current = false;
		void draft("as-is");
	}, [visible, draft]);

	const recorded = useRef(false);
	/** Logs the nudge once per opening, with the contact it went to. */
	const record = async () => {
		if (recorded.current) return;
		recorded.current = true;
		const contact = {
			name: contactName.trim(),
			role: app.contact?.role ?? "",
			email: email.trim(),
		};
		await recordNudge(app, contact.name || contact.email ? contact : null);
	};

	const copy = async () => {
		await Clipboard.setStringAsync(body);
		setNotice("Copied. Paste it wherever you talk to them.");
		await record();
	};

	const openEmail = async () => {
		const url = `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
		try {
			await Linking.openURL(url);
			await record();
			onSent();
		} catch (caught) {
			console.warn("[career] no email app", caught);
			setNotice("No email app opened. Copy the text instead.");
		}
	};

	const firstName = app.contact?.name.split(" ")[0];
	const ready = body.trim().length > 0 && !drafting;

	return (
		<Sheet
			visible={visible}
			title={firstName ? `Follow-up to ${firstName}` : `Follow-up to ${app.company}`}
			onClose={onClose}
			footer={
				<Footer>
					<PillButton
						label="Copy"
						variant="secondary"
						style={styles.flex}
						disabled={!ready}
						onPress={() => void copy()}
					/>
					<PillButton
						label="Open in email"
						style={styles.flex}
						disabled={!ready || !email.includes("@")}
						onPress={() => void openEmail()}
					/>
				</Footer>
			}
		>
			<View style={styles.eyebrow}>
				<Icon
					name={error ? "Line/Close" : "Filled/Sparkle"}
					size={14}
					color={error ? colors.textDanger : colors.accentDefault}
				/>
				<PoText variant="eyebrow11" tone={error ? "textDanger" : "textTertiary"}>
					{drafting
						? "Drafting…"
						: error
							? "Couldn't draft"
							: "Drafted from your notes · edit freely"}
				</PoText>
			</View>
			{error ? (
				<PoText variant="body15" tone="textSecondary" style={styles.pad}>
					{error}
				</PoText>
			) : null}
			<TextBox
				label="Message"
				value={body}
				onChangeText={setBody}
				editable={!drafting}
				placeholder={drafting ? "Drafting…" : "Write your follow-up"}
				minHeight={220}
			/>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.tones}
			>
				{TONES.map((option) => (
					<FilterChip
						key={option.id}
						label={option.label}
						selected={tone === option.id}
						onPress={() => {
							setTone(option.id);
							void draft(option.id, body || undefined);
						}}
					/>
				))}
			</ScrollView>
			<View style={styles.eyebrow}>
				<PoText variant="eyebrow11" tone="textTertiary">
					Send to
				</PoText>
			</View>
			{app.contact?.email ? (
				<ListRow
					title={app.contact.name || app.contact.email}
					subtitle={app.contact.email}
					value="Email"
					last
				/>
			) : (
				<FieldGroup>
					<FieldRow label="Name" value={contactName} onChangeText={setContactName} />
					<FieldRow
						label="Email"
						value={email}
						onChangeText={setEmail}
						keyboardType="email-address"
						last
					/>
				</FieldGroup>
			)}
			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.pad}>
					{notice}
				</PoText>
			) : null}
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	pad: { paddingHorizontal: 6 },
	eyebrow: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 6, paddingTop: 4 },
	tones: { gap: 8 },
});
