import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { FilterChip, Footer, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { useSpeaker } from "@/lib/voice";
import { deleteStep, saveStep, skip, tick } from "../data/care-actions";
import { useCareToday } from "../hooks/use-care";
import { stepsOn } from "../lib/care-math";
import { type Area, AREAS, AREA_LABELS, type Routine, type Step } from "../lib/care-model";
import { CareScreen } from "./care-screen";
import { Banner, Card, CardHead, StepRow } from "./home-cards";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Draft = {
	id?: string;
	name: string;
	detail: string;
	minutes: string;
	area: Area;
	days: number[];
	short: string;
	order: number;
	productId: string | null;
};

const blank = (order: number): Draft => ({
	name: "",
	detail: "",
	minutes: "1",
	area: "face",
	days: [],
	short: "",
	order,
	productId: null,
});

/** Morning or night routine: the steps by area with their products, Start to go one by one. */
export function RoutineScreen({ routine }: { routine: Routine }) {
	const { data, today, record, now } = useCareToday();
	const { steps, products, settings } = data;
	const speaker = useSpeaker();
	const list = stepsOn(steps, routine, today);
	const all = steps.filter((step) => step.routine === routine);
	const [guided, setGuided] = useState(false);
	const [draft, setDraft] = useState<Draft | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const done = record?.steps ?? {};
	const minutes = list.reduce((sum, step) => sum + step.minutes, 0);
	const next = list.find((step) => !done[step.id]) ?? null;
	const night = routine === "night";

	const failed = (what: string) => (error: unknown) => {
		console.error(`[care] could not ${what}`, error);
		setNotice("Couldn't save on this phone. Try again.");
	};

	const onTick = (step: Step) => tick(today, step, list).catch(failed("tick the step"));

	const say = (step: Step | null) => {
		if (step) speaker.speak(step.id, [{ text: `${step.name}. ${step.detail}` }]);
	};

	const advance = () => {
		if (!next) {
			setGuided(false);
			router.back();
			return;
		}
		haptics.success();
		const after = list.find((step) => step.id !== next.id && !done[step.id]) ?? null;
		void onTick(next).then(() => say(after));
		if (!after) setGuided(false);
	};

	const save = () => {
		if (!draft) return;
		const name = draft.name.trim();
		if (!name) {
			setNotice("Give the step a name.");
			return;
		}
		saveStep({
			...(draft.id ? { id: draft.id } : {}),
			routine,
			area: draft.area,
			name,
			detail: draft.detail.trim(),
			productId: draft.productId,
			minutes: Math.min(60, Math.max(0, Math.round(Number(draft.minutes) || 0))),
			days: draft.days,
			short:
				draft.short || (draft.days.length > 0 ? (name.split(/\s+/)[0]?.slice(0, 8) ?? "") : ""),
			order: draft.order,
		})
			.then(() => setDraft(null))
			.catch(failed("save the step"));
	};

	const edit = (step: Step) =>
		setDraft({
			id: step.id,
			name: step.name,
			detail: step.detail,
			minutes: String(step.minutes),
			area: step.area,
			days: step.days,
			short: step.short,
			order: step.order,
			productId: step.productId,
		});

	const groups: { title: string; steps: Step[] }[] = [
		{ title: "Face", steps: list.filter((step) => step.area === "face") },
		{ title: "Body and hair", steps: list.filter((step) => step.area !== "face") },
	].filter((group) => group.steps.length > 0);

	const productOf = (step: Step) =>
		products.find((product) => product.id === step.productId) ?? null;

	return (
		<CareScreen
			ask={false}
			action={{
				icon: "Filled/Edit",
				label: "Add a step",
				onPress: () => setDraft(blank(all.length)),
			}}
		>
			<ScreenTitle
				eyebrow={`${night ? "Tonight" : "This morning"} · ${WEEKDAYS[now.getDay()]} · ${minutes} min`}
				title={night ? "Night routine" : "Morning routine"}
			/>
			{notice ? (
				<PoText variant="meta13" tone="textSecondary">
					{notice}
				</PoText>
			) : null}
			{groups.length === 0 ? (
				<Card>
					<PoText variant="body15" tone="textSecondary">
						{`Nothing in the ${routine} routine today. Add a step with the pencil.`}
					</PoText>
				</Card>
			) : null}
			{groups.map((group) => {
				const weekly = group.steps.find((step) => step.days.length > 0);
				return (
					<Card key={group.title}>
						<CardHead
							title={group.title}
							right={
								weekly && group.title !== "Face"
									? WEEKDAYS[now.getDay()]
									: `${group.steps.length} steps`
							}
						/>
						<View>
							{group.steps.map((step, index) => (
								<StepRow
									key={step.id}
									step={step}
									product={productOf(step)}
									doneAt={done[step.id] ?? null}
									next={guided && step.id === next?.id}
									onPress={() => void onTick(step)}
									onLongPress={() => edit(step)}
									last={index === group.steps.length - 1}
								/>
							))}
						</View>
					</Card>
				);
			})}
			{settings.skin.includes("sensitive") ? (
				<Banner tone="accent" eyebrow="Sensitive skin rule">
					One new product at a time. Patch test behind the ear for 2 days before it goes on your
					face.
				</Banner>
			) : null}
			<PoText variant="meta13" tone="textTertiary" style={styles.hint}>
				Tap to tick. Long press a step to change it or move it to other days.
			</PoText>
			<Footer>
				<PillButton
					label={night ? "Skip tonight" : "Skip today"}
					variant="secondary"
					style={styles.flex}
					onPress={() => {
						void skip(today, routine)
							.then(() => router.back())
							.catch(failed("skip"));
					}}
				/>
				<PillButton
					label={guided ? (next ? "Done · next" : "Finish") : next ? "Start" : "All done"}
					style={styles.flex}
					disabled={!next && !guided}
					onPress={() => {
						if (!guided) {
							setGuided(true);
							say(next);
							return;
						}
						advance();
					}}
				/>
			</Footer>

			<Sheet
				visible={draft !== null}
				title={draft?.id ? "Edit step" : "Add a step"}
				onClose={() => setDraft(null)}
				action={{ label: "Save", onPress: save }}
			>
				{draft ? (
					<View style={styles.sheet}>
						<TextField
							label="Name"
							value={draft.name}
							onChangeText={(name) => setDraft({ ...draft, name })}
							placeholder="Vitamin C serum"
						/>
						<TextField
							label="How"
							value={draft.detail}
							onChangeText={(detail) => setDraft({ ...draft, detail })}
							placeholder="3 drops · let it dry"
						/>
						<TextField
							label="Minutes"
							value={draft.minutes}
							onChangeText={(value) => setDraft({ ...draft, minutes: value })}
							keyboardType="number-pad"
							suffix="min"
						/>
						<View style={styles.chips}>
							{AREAS.map((area) => (
								<FilterChip
									key={area}
									label={AREA_LABELS[area]}
									selected={draft.area === area}
									onPress={() => setDraft({ ...draft, area })}
								/>
							))}
						</View>
						<PoText variant="meta13" tone="textSecondary">
							Days (none picked = every day)
						</PoText>
						<View style={styles.chips}>
							{WEEKDAYS.map((label, day) => (
								<FilterChip
									key={label}
									label={label}
									selected={draft.days.includes(day)}
									onPress={() =>
										setDraft({
											...draft,
											days: draft.days.includes(day)
												? draft.days.filter((item) => item !== day)
												: [...draft.days, day].sort((a, b) => a - b),
										})
									}
								/>
							))}
						</View>
						{draft.id ? (
							<PillButton
								label="Delete step"
								variant="secondary"
								onPress={() => {
									const step = steps.find((item) => item.id === draft.id);
									if (step) void deleteStep(step).catch(failed("delete the step"));
									setDraft(null);
								}}
							/>
						) : null}
					</View>
				) : null}
			</Sheet>
		</CareScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	hint: { paddingHorizontal: 6 },
	sheet: { gap: 12 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
