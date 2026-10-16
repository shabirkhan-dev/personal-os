import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { FilterChip, Footer, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { newId } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { clockOf } from "@/modules/home/lib/module-day";
import { usePoTheme } from "@/theme";
import { removePlan, savePlan } from "../data/daily-actions";
import { useDailyToday } from "../hooks/use-daily";
import { draftPlan, freeGaps, hoursLabel, MODULE_LABELS, withDone } from "../lib/daily-math";
import { type Block, PLAN_MODULES, type PlanModule } from "../lib/daily-model";
import { readClock } from "../lib/parse-daily-line";
import { AgendaRow, Card } from "./daily-cards";
import { DailyScreen } from "./daily-screen";

type Draft = { id: string | null; title: string; time: string; length: string; module: PlanModule };

/** Plan the day: drafted from the modules, every block editable, the free time called out. */
export function PlanScreen() {
	const { colors } = usePoTheme();
	const { data, sources, now, today, saved } = useDailyToday();
	const [blocks, setBlocks] = useState<Block[]>(
		() => saved?.blocks ?? draftPlan(sources, data.settings, now),
	);
	const [draft, setDraft] = useState<Draft | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const items = withDone(blocks, sources);
	const gaps = freeGaps(blocks, data.settings);
	const biggest = [...gaps].sort((a, b) => b.to - b.from - (a.to - a.from))[0];

	const edit = (block: Block) =>
		setDraft({
			id: block.id,
			title: block.title,
			time: clockOf(block.minutes),
			length: String(block.length),
			module: block.module,
		});

	const apply = () => {
		if (!draft) return;
		const minutes = readClock(draft.time, false);
		const title = draft.title.trim();
		if (minutes === null || !title) {
			setNotice("Give the block a name and a time like 14:30.");
			return;
		}
		const length = Math.max(0, Math.round(Number(draft.length) || 0));
		const next: Block = {
			id: draft.id ?? newId(),
			minutes,
			length,
			title,
			detail: `${MODULE_LABELS[draft.module]} · ${length >= 60 ? hoursLabel(length) : `${length} min`}`,
			module: draft.module,
		};
		setBlocks((list) =>
			[...list.filter((item) => item.id !== next.id), next].sort((a, b) => a.minutes - b.minutes),
		);
		setDraft(null);
		setNotice(null);
	};

	const use = () => {
		savePlan(today, blocks)
			.then(() => {
				haptics.success();
				router.back();
			})
			.catch((error: unknown) => {
				console.error("[daily] could not save the plan", error);
				setNotice("Couldn't save on this phone. Try again.");
			});
	};

	return (
		<DailyScreen
			action={{
				icon: "Line/Plus",
				label: "Add a block",
				onPress: () =>
					setDraft({
						id: null,
						title: "",
						time: clockOf(Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 30),
						length: "30",
						module: "daily-life",
					}),
			}}
		>
			<ScreenTitle
				eyebrow={
					saved
						? "Your plan · tap a block to change it"
						: "Drafted from your modules · edit anything"
				}
				title="Plan the day"
			/>
			<Card>
				{items.map((item) => (
					<AgendaRow key={item.id} item={item} onPress={() => edit(item)} />
				))}
			</Card>
			{biggest ? (
				<View style={[styles.free, { backgroundColor: colors.statusSuccessSubtle }]}>
					<PoText variant="eyebrow11" tone="textSuccess">
						{`${hoursLabel(biggest.to - biggest.from)} free · ${clockOf(biggest.from)} to ${clockOf(biggest.to)}`}
					</PoText>
					<PoText variant="meta13">
						Left open on purpose. A walk, reading, or nothing at all.
					</PoText>
				</View>
			) : null}
			{notice ? (
				<PoText variant="meta13" tone="textSecondary">
					{notice}
				</PoText>
			) : null}
			<Footer>
				<PillButton
					label="Regenerate"
					variant="secondary"
					style={styles.flex}
					onPress={() => {
						haptics.tap();
						setBlocks(draftPlan(sources, data.settings, now));
						if (saved)
							void removePlan(today).catch((error: unknown) =>
								console.error("[daily] could not reset the plan", error),
							);
					}}
				/>
				<PillButton label="Use this plan" style={styles.flex} onPress={use} />
			</Footer>

			<Sheet
				visible={draft !== null}
				title={draft?.id ? "Change block" : "Add a block"}
				onClose={() => setDraft(null)}
				action={{ label: "Done", onPress: apply }}
			>
				{draft ? (
					<View style={styles.sheet}>
						<TextField
							label="What"
							value={draft.title}
							onChangeText={(title) => setDraft({ ...draft, title })}
							placeholder="Walk by the river"
						/>
						<TextField
							label="Starts"
							value={draft.time}
							onChangeText={(time) => setDraft({ ...draft, time })}
							placeholder="14:30"
							keyboardType="numbers-and-punctuation"
						/>
						<TextField
							label="Length"
							value={draft.length}
							onChangeText={(length) => setDraft({ ...draft, length })}
							keyboardType="number-pad"
							suffix="min"
						/>
						<View style={styles.chips}>
							{PLAN_MODULES.map((module) => (
								<FilterChip
									key={module}
									label={MODULE_LABELS[module]}
									selected={draft.module === module}
									onPress={() => setDraft({ ...draft, module })}
								/>
							))}
						</View>
						{draft.id ? (
							<PillButton
								label="Remove from today"
								variant="ghost"
								onPress={() => {
									setBlocks((list) => list.filter((item) => item.id !== draft.id));
									setDraft(null);
								}}
							/>
						) : null}
					</View>
				) : null}
			</Sheet>
		</DailyScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	free: { gap: 4, padding: 14, borderRadius: 22 },
	sheet: { gap: 12 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
