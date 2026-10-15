import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { textStyles } from "@personal-os/tokens";
import { Icon } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { toTextStyle, usePoTheme } from "@/theme";
import { addApplication } from "../data/career-actions";
import type { Halal } from "../lib/career-model";
import { looksLikeLink, normaliseLink } from "../lib/parse-career-line";
import { CareerAiError, type JobDetails, useCareerAi } from "../services/career-ai";
import { Footer } from "@/components/module-ui";
import { FieldGroup, FieldRow, TextBox } from "./field-rows";

type Draft = { company: string; role: string; pay: string; where: string; cv: string };

const emptyDraft: Draft = { company: "", role: "", pay: "", where: "", cv: "" };

type ReadState =
	| { kind: "idle" }
	| { kind: "reading" }
	| { kind: "read" }
	| { kind: "failed"; message: string; unreadable: boolean };

const linkStyle = toTextStyle(textStyles.body15);

export type AddApplicationSheetProps = {
	visible: boolean;
	/** A link pasted in the ask bar; read as soon as the sheet opens. */
	initialLink?: string;
	onClose: () => void;
	onSaved: (company: string) => void;
};

/**
 * Add application: paste a link and the AI fills company, role, pay and where, plus a halal
 * reading the person confirms. Offline, or when a page blocks reading, everything is typed in.
 */
export function AddApplicationSheet({
	visible,
	initialLink = "",
	onClose,
	onSaved,
}: AddApplicationSheetProps) {
	const { colors } = usePoTheme();
	const ai = useCareerAi();
	const [link, setLink] = useState(initialLink);
	const [jobText, setJobText] = useState<string | null>(null);
	const [draft, setDraft] = useState<Draft>(emptyDraft);
	const [halal, setHalal] = useState<Halal>({ status: "unsure", note: "", confirmed: false });
	const [read, setRead] = useState<ReadState>({ kind: "idle" });
	const [saving, setSaving] = useState(false);
	const request = useRef(0);

	const fill = (details: JobDetails) => {
		setDraft((current) => ({
			company: details.company || current.company,
			role: details.role || current.role,
			pay: details.pay || current.pay,
			where: details.where || current.where,
			cv: current.cv,
		}));
		setHalal({ status: details.halal.status, note: details.halal.note, confirmed: false });
		setRead({ kind: "read" });
	};

	const readSource = async (source: { url: string } | { text: string }) => {
		const id = ++request.current;
		setRead({ kind: "reading" });
		try {
			const details = await ai.readJob(source);
			if (id === request.current) fill(details);
		} catch (error) {
			if (id !== request.current) return;
			const known = error instanceof CareerAiError ? error : null;
			setRead({
				kind: "failed",
				message: known?.message ?? "Couldn't read this. Fill it in yourself.",
				unreadable: known?.kind === "unreadable",
			});
		}
	};

	// A link handed over from the ask bar is read straight away.
	const started = useRef(false);
	useEffect(() => {
		if (!visible || started.current || !initialLink) return;
		started.current = true;
		void readSource({ url: normaliseLink(initialLink) });
		// readSource is recreated each render; reading once per opening is the intent.
		// oxlint-disable-next-line react/exhaustive-deps
	}, [visible, initialLink]);

	const canRead = looksLikeLink(link) && read.kind !== "reading";
	const canSave = draft.company.trim().length > 0 && read.kind !== "reading" && !saving;

	const save = async (stage: "saved" | "applied") => {
		if (!canSave) return;
		setSaving(true);
		try {
			await addApplication({
				...draft,
				link: link.trim() ? normaliseLink(link) : "",
				stage,
				halal,
			});
			onSaved(draft.company.trim());
		} catch (error) {
			console.error("[career] could not save the application", error);
			setRead({
				kind: "failed",
				message: "Couldn't save on this phone. Try again.",
				unreadable: false,
			});
		} finally {
			setSaving(false);
		}
	};

	const set = (key: keyof Draft) => (value: string) =>
		setDraft((current) => ({ ...current, [key]: value }));
	const reading = read.kind === "reading";
	const failed = read.kind === "failed";

	const footer =
		jobText === null && failed && read.unreadable ? (
			<Footer>
				<PillButton
					label="Paste job text"
					variant="secondary"
					style={styles.flex}
					onPress={() => setJobText("")}
				/>
				<PillButton
					label="Save"
					style={styles.flex}
					disabled={!canSave}
					onPress={() => void save("saved")}
				/>
			</Footer>
		) : (
			<Footer>
				<PillButton
					label={reading ? "Cancel" : "Save for later"}
					variant="secondary"
					style={styles.flex}
					disabled={!reading && !canSave}
					onPress={() => {
						if (reading) {
							request.current += 1;
							setRead({ kind: "idle" });
						} else void save("saved");
					}}
				/>
				<PillButton
					label={reading ? "Reading…" : "Mark applied"}
					style={styles.flex}
					disabled={!canSave}
					onPress={() => void save("applied")}
				/>
			</Footer>
		);

	return (
		<Sheet visible={visible} title="Add application" onClose={onClose} footer={footer}>
			{jobText === null ? (
				<View
					style={[
						styles.link,
						{
							backgroundColor: colors.bgSubtle,
							borderColor: failed ? colors.statusDanger : "transparent",
						},
					]}
				>
					<Icon name="Copy" size={18} color={colors.textSecondary} />
					<TextInput
						value={link}
						onChangeText={setLink}
						placeholder="Paste a job link"
						placeholderTextColor={colors.textTertiary}
						autoCapitalize="none"
						autoCorrect={false}
						keyboardType="url"
						returnKeyType="go"
						onSubmitEditing={() => canRead && void readSource({ url: normaliseLink(link) })}
						accessibilityLabel="Job link"
						style={[linkStyle, styles.flex, { color: colors.textPrimary }]}
					/>
					{canRead && read.kind !== "read" ? (
						<Pressable
							accessibilityRole="button"
							onPress={() => void readSource({ url: normaliseLink(link) })}
						>
							<PoText variant="meta13" tone="textLink">
								Read
							</PoText>
						</Pressable>
					) : null}
				</View>
			) : (
				<View style={styles.gap}>
					<TextBox
						label="Job text"
						value={jobText}
						onChangeText={setJobText}
						placeholder="Paste the job post here"
					/>
					<PillButton
						label={reading ? "Reading…" : "Read the text"}
						variant="secondary"
						disabled={jobText.trim().length < 40 || reading}
						onPress={() => void readSource({ text: jobText })}
					/>
				</View>
			)}

			{read.kind !== "idle" ? (
				<View style={styles.status}>
					<Icon
						name={failed ? "Line/Close" : "Filled/Sparkle"}
						size={14}
						color={failed ? colors.textDanger : colors.accentDefault}
					/>
					<PoText variant="eyebrow11" tone={failed ? "textDanger" : "textTertiary"}>
						{reading
							? "Reading the link…"
							: failed
								? "Couldn't read this link"
								: "Read from link · check it"}
					</PoText>
				</View>
			) : null}
			{failed ? (
				<PoText variant="body15" tone="textSecondary" style={styles.help}>
					{read.message}
				</PoText>
			) : null}

			<FieldGroup dimmed={reading}>
				<FieldRow
					label="Company"
					value={draft.company}
					onChangeText={set("company")}
					placeholder={reading ? "Reading…" : "Add"}
					editable={!reading}
				/>
				<FieldRow label="Role" value={draft.role} onChangeText={set("role")} editable={!reading} />
				<FieldRow label="Pay" value={draft.pay} onChangeText={set("pay")} editable={!reading} />
				<FieldRow
					label="Where"
					value={draft.where}
					onChangeText={set("where")}
					editable={!reading}
				/>
				<FieldRow
					label="CV"
					value={draft.cv}
					onChangeText={set("cv")}
					placeholder="Which CV"
					editable={!reading}
					last
				/>
			</FieldGroup>

			<View style={styles.label}>
				<PoText variant="eyebrow11" tone="textTertiary">
					Halal check
				</PoText>
			</View>
			<Pressable
				accessibilityRole="checkbox"
				accessibilityState={{ checked: halal.confirmed, disabled: reading }}
				disabled={reading}
				onPress={() => setHalal((current) => ({ ...current, confirmed: !current.confirmed }))}
				style={[
					styles.halal,
					{ borderBottomColor: colors.borderDefault, opacity: reading ? 0.5 : 1 },
				]}
			>
				<View style={styles.flex}>
					<PoText variant="row15">Clean income — I've checked</PoText>
					<PoText
						variant="meta13"
						tone={halal.status === "flagged" ? "textDanger" : "textSecondary"}
					>
						{reading
							? "Waiting for the company details."
							: halal.note || "Check the company yourself before applying."}
					</PoText>
				</View>
				<Checkbox checked={halal.confirmed} />
			</Pressable>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	gap: { gap: 10 },
	link: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingHorizontal: 16,
		paddingVertical: 14,
		borderRadius: 22,
		borderWidth: 1.5,
	},
	status: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 6, paddingTop: 4 },
	help: { paddingHorizontal: 6 },
	label: { paddingLeft: 6, paddingTop: 4 },
	halal: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 14,
		borderBottomWidth: 1,
	},
});
