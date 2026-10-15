import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { logSkillSession, startSkillPlan } from "../data/career-actions";
import type { Application } from "../lib/career-model";
import { CareerAiError, useCareerAi } from "../services/career-ai";
import { FilterChip, Footer } from "./career-ui";

const SUGGESTIONS = [
	"System design",
	"NestJS testing",
	"React Native performance",
	"Web security",
	"Rust basics",
];

export type SkillFocusSheetProps = {
	visible: boolean;
	current?: string;
	apps: readonly Application[];
	onClose: () => void;
};

/** Pick what to learn; the AI plans six weeks of 30-minute days around it. */
export function SkillFocusSheet({ visible, current = "", apps, onClose }: SkillFocusSheetProps) {
	const ai = useCareerAi();
	const [focus, setFocus] = useState(current);
	const [building, setBuilding] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const build = async () => {
		const topic = focus.trim();
		if (topic.length < 2) return setError("Name a skill, like System design.");
		setBuilding(true);
		setError(null);
		const roles = apps
			.filter((app) => app.stage === "applied" || app.stage === "interview")
			.slice(0, 5)
			.map((app) => `${app.role} at ${app.company}`)
			.join("; ");
		try {
			const path = await ai.skillPath(topic, roles ? `Applying for: ${roles}` : "");
			await startSkillPlan(path.title || topic, path.weeks);
			onClose();
		} catch (caught) {
			setError(caught instanceof CareerAiError ? caught.message : "Couldn't plan it. Try again.");
		} finally {
			setBuilding(false);
		}
	};

	return (
		<Sheet
			visible={visible}
			title={current ? "Change plan" : "Pick a skill"}
			onClose={onClose}
			action={{
				label: building ? "Planning…" : "Build my path",
				disabled: building,
				onPress: () => void build(),
			}}
		>
			<PoText variant="body15" tone="textSecondary">
				Six weeks, 30 minutes a day, five days a week — ending with something you can show an
				employer.
			</PoText>
			<TextField
				label="What to learn"
				value={focus}
				onChangeText={setFocus}
				placeholder="System design"
			/>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.chips}
			>
				{SUGGESTIONS.map((suggestion) => (
					<FilterChip
						key={suggestion}
						label={suggestion}
						selected={focus === suggestion}
						onPress={() => setFocus(suggestion)}
					/>
				))}
			</ScrollView>
			{current ? (
				<PoText variant="meta13" tone="textTertiary">
					A new path starts this week. Your practice history stays.
				</PoText>
			) : null}
			{error ? (
				<PoText variant="meta13" tone="textDanger">
					{error}
				</PoText>
			) : null}
		</Sheet>
	);
}

const SESSION_SECONDS = 30 * 60;

export type SkillTimerSheetProps = {
	visible: boolean;
	title: string;
	detail: string;
	week: number;
	day: number;
	onClose: () => void;
};

/** A 30-minute focus timer; finishing logs the day as done (or partial if stopped early). */
export function SkillTimerSheet({
	visible,
	title,
	detail,
	week,
	day,
	onClose,
}: SkillTimerSheetProps) {
	const [elapsed, setElapsed] = useState(0);
	const [running, setRunning] = useState(true);
	const startedAt = useRef(0);
	const banked = useRef(0);

	useEffect(() => {
		if (!running) return;
		startedAt.current = Date.now();
		const timer = setInterval(() => {
			setElapsed(
				Math.min(
					SESSION_SECONDS,
					banked.current + Math.floor((Date.now() - startedAt.current) / 1000),
				),
			);
		}, 500);
		return () => {
			banked.current += Math.floor((Date.now() - startedAt.current) / 1000);
			clearInterval(timer);
		};
	}, [running]);

	const finished = elapsed >= SESSION_SECONDS;
	const remaining = SESSION_SECONDS - elapsed;
	const clock = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

	const save = async () => {
		const minutes = Math.max(1, Math.round(elapsed / 60));
		try {
			await logSkillSession({ week, day, minutes, status: minutes >= 25 ? "done" : "partial" });
		} catch (caught) {
			console.error("[career] could not save the session", caught);
		}
		onClose();
	};

	return (
		<Sheet
			visible={visible}
			title={title}
			onClose={onClose}
			footer={
				<Footer>
					<PillButton
						label={running ? "Pause" : "Resume"}
						variant="secondary"
						style={styles.flex}
						disabled={finished}
						onPress={() => setRunning((value) => !value)}
					/>
					<PillButton
						label={finished ? "Done" : "Finish"}
						style={styles.flex}
						disabled={elapsed < 60}
						onPress={() => void save()}
					/>
				</Footer>
			}
		>
			<PoText variant="body15" tone="textSecondary">
				{detail}
			</PoText>
			<View style={styles.clock}>
				<PoText
					variant="hero40"
					accessibilityRole="timer"
					accessibilityLabel={`${Math.ceil(remaining / 60)} minutes left`}
				>
					{clock}
				</PoText>
				<PoText variant="meta13" tone="textTertiary">
					{finished
						? "Thirty minutes done."
						: running
							? "Phone down, one thing at a time."
							: "Paused"}
				</PoText>
			</View>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	chips: { gap: 8 },
	clock: { alignItems: "center", gap: 6, paddingVertical: 24 },
});
