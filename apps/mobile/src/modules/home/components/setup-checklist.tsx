import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { ProgressBar } from "@/components/module-ui";
import { PoText } from "@/components/ui/po-text";
import { useCollection } from "@/lib/db/collection";
import { haptics } from "@/lib/haptics";
import { getItemAsync, setItemAsync } from "@/lib/secure-store";
import { careSteps } from "@/modules/care/data/collections";
import { applications } from "@/modules/career/data/collections";
import { dailySettings } from "@/modules/daily/data/collections";
import { faithSettings } from "@/modules/faith/data/collections";
import { pieces } from "@/modules/fashion/data/collections";
import { financeSettings } from "@/modules/finance/data/collections";
import { foodSettings, myRecipes } from "@/modules/food/data/collections";
import { healthMedicines } from "@/modules/health/data/collections";
import type { ModuleId } from "@/modules/onboarding/lib/options";
import { wishlistDreams } from "@/modules/wishlist/data/collections";
import { trainingPrograms } from "@/modules/workout/data/collections";
import { usePoTheme } from "@/theme";
import { type SetupAction, setupProgress, setupSteps } from "../lib/setup-steps";

const DISMISSED_KEY = "setup-checklist-dismissed";

const has = (list: readonly unknown[] | undefined) => (list?.length ?? 0) > 0;

/** Which modules already have something the person added. */
function useStarted(): { started: ReadonlySet<ModuleId>; ready: boolean } {
	const daily = useCollection(dailySettings);
	const food = useCollection(foodSettings);
	const recipes = useCollection(myRecipes);
	const programs = useCollection(trainingPrograms);
	const steps = useCollection(careSteps);
	const faith = useCollection(faithSettings);
	const finance = useCollection(financeSettings);
	const wardrobe = useCollection(pieces);
	const jobs = useCollection(applications);
	const medicines = useCollection(healthMedicines);
	const dreams = useCollection(wishlistDreams);
	const all = [
		daily,
		food,
		recipes,
		programs,
		steps,
		faith,
		finance,
		wardrobe,
		jobs,
		medicines,
		dreams,
	];
	const dailyNow = daily.data?.[0];
	const started = new Set<ModuleId>();
	if (dailyNow && (dailyNow.own.length > 0 || dailyNow.minimum.length > 0))
		started.add("daily-life");
	if (has(recipes.data) || (food.data?.[0]?.meals.length ?? 0) > 0) started.add("food");
	if (has(programs.data)) started.add("workout");
	if (has(steps.data)) started.add("skincare");
	if (faith.data?.[0]?.setUp) started.add("faith");
	if (finance.data?.[0]?.setUp) started.add("finance");
	if (has(wardrobe.data)) started.add("fashion");
	if (has(jobs.data)) started.add("career");
	if (has(medicines.data)) started.add("health");
	if (has(dreams.data)) started.add("wishlist");
	return { started, ready: all.every((query) => !query.isPending) };
}

/**
 * Getting started, on Overview until every picked module has something in it (or the person
 * hides it). Each row offers their own, AI or a template; none of them adds anything by itself.
 */
export function SetupChecklist({
	modules,
	onOpen,
}: {
	modules: readonly ModuleId[];
	onOpen: (module: ModuleId) => void;
}) {
	const { colors } = usePoTheme();
	const { started, ready } = useStarted();
	const [dismissed, setDismissed] = useState<boolean | null>(null);
	const [open, setOpen] = useState<ModuleId | null>(null);
	const [showAll, setShowAll] = useState(false);

	useEffect(() => {
		getItemAsync(DISMISSED_KEY)
			.then((value) => setDismissed(value === "1"))
			.catch((error: unknown) => {
				console.warn("[home] could not read the checklist setting", error);
				setDismissed(false);
			});
	}, []);

	const steps = setupSteps(modules);
	const progress = setupProgress(steps, started);
	if (!ready || dismissed !== false || steps.length === 0 || progress.next === null) return null;

	const hide = () => {
		setDismissed(true);
		setItemAsync(DISMISSED_KEY, "1").catch((error: unknown) =>
			console.warn("[home] could not save the checklist setting", error),
		);
	};

	const go = (module: ModuleId, action: SetupAction) => {
		haptics.tap();
		if (action.href === "home") onOpen(module);
		else router.push(action.href as Parameters<typeof router.push>[0]);
	};

	const expanded = open ?? progress.next.module;
	// Left to do first, then done; four at a time unless the person asks for all.
	const ordered = [
		...steps.filter((step) => !started.has(step.module)),
		...steps.filter((step) => started.has(step.module)),
	];
	const shown = showAll ? ordered : ordered.slice(0, 4);

	return (
		<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
			<View style={styles.head}>
				<View style={styles.flex}>
					<PoText variant="eyebrow11" tone="textTertiary">
						{`GETTING STARTED · ${progress.done} OF ${progress.total}`}
					</PoText>
					<PoText variant="title18">Your app starts empty</PoText>
				</View>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Hide getting started"
					hitSlop={10}
					onPress={hide}
				>
					<Icon name="Line/Close" size={16} color={colors.textTertiary} />
				</Pressable>
			</View>
			<ProgressBar share={progress.done / progress.total} tone="statusSuccess" />
			{shown.map((step) => {
				const done = started.has(step.module);
				const isOpen = !done && expanded === step.module;
				const actions = [step.own, step.ai, step.template].filter(
					(action): action is SetupAction => action !== null,
				);
				return (
					<View key={step.module} style={[styles.step, { borderTopColor: colors.borderDefault }]}>
						<Pressable
							accessibilityRole="button"
							accessibilityState={{ checked: done, expanded: isOpen }}
							onPress={() => (done ? onOpen(step.module) : setOpen(step.module))}
							style={styles.row}
						>
							<View
								style={[
									styles.tick,
									done
										? { backgroundColor: colors.statusSuccess, borderColor: colors.statusSuccess }
										: { borderColor: colors.borderStrong },
								]}
							>
								{done ? <Icon name="Line/Check" size={12} color={colors.textOnAccent} /> : null}
							</View>
							<View style={styles.flex}>
								<PoText variant="row15" tone={done ? "textTertiary" : "textPrimary"}>
									{step.title}
								</PoText>
								{isOpen ? (
									<PoText variant="meta13" tone="textSecondary">
										{step.hint}
									</PoText>
								) : null}
							</View>
						</Pressable>
						{isOpen ? (
							<View style={styles.actions}>
								{actions.map((action) => (
									<Pressable
										key={action.label}
										accessibilityRole="button"
										onPress={() => go(step.module, action)}
										style={({ pressed }) => [
											styles.action,
											{ backgroundColor: pressed ? colors.bgHover : colors.bgSubtle },
										]}
									>
										<PoText variant="meta13">{action.label}</PoText>
									</Pressable>
								))}
							</View>
						) : null}
					</View>
				);
			})}
			{ordered.length > shown.length || showAll ? (
				<Pressable
					accessibilityRole="button"
					onPress={() => setShowAll(!showAll)}
					style={styles.more}
				>
					<PoText variant="meta13" tone="textLink">
						{showAll ? "Show less" : `Show all ${ordered.length}`}
					</PoText>
				</Pressable>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	card: { gap: 12, padding: 16, borderRadius: 22 },
	head: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
	flex: { flex: 1, minWidth: 0, gap: 2 },
	step: { gap: 10, paddingTop: 12, borderTopWidth: 1 },
	row: { flexDirection: "row", alignItems: "center", gap: 12 },
	tick: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 1.5,
		alignItems: "center",
		justifyContent: "center",
	},
	actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingLeft: 34 },
	action: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
	more: { alignSelf: "flex-start", paddingTop: 4 },
});
