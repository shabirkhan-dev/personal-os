import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { showDialog } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { applyPlan, type RoutinePlan } from "../data/care-actions";
import { useCare } from "../hooks/use-care";
import { AREA_LABELS } from "../lib/care-model";
import { ProductImage } from "./product-image";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * What a template or AI's draft would add, step by step with how to apply each, then Add (next
 * to what the person has) or Replace (their steps and habits). Nothing is saved until then.
 */
export function PlanPreview({ plan, note }: { plan: RoutinePlan; note?: string }) {
	const { colors } = usePoTheme();
	const data = useCare();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const hasRoutine = data.steps.length > 0 || data.habits.length > 0;

	const apply = (mode: "add" | "replace") => {
		setBusy(true);
		setError(null);
		applyPlan(plan, data, mode, data.settings)
			.then(() => {
				haptics.success();
				router.dismissTo("/");
			})
			.catch((caught: unknown) => {
				console.error("[care] could not add the routine", caught);
				setError("Couldn't save on this phone. Try again.");
			})
			.finally(() => setBusy(false));
	};

	const groups = (["morning", "night"] as const)
		.map((routine) => ({ routine, steps: plan.steps.filter((step) => step.routine === routine) }))
		.filter((group) => group.steps.length > 0);

	return (
		<View style={styles.root}>
			{note ? (
				<PoText variant="meta13" tone="textSecondary">
					{note}
				</PoText>
			) : null}
			{groups.map((group) => (
				<View key={group.routine} style={[styles.card, { backgroundColor: colors.bgSurface }]}>
					<PoText variant="title18">{group.routine === "morning" ? "Morning" : "Night"}</PoText>
					{group.steps.map((step, index) => {
						const product = plan.products.find((item) => item.name === step.productId);
						return (
							// oxlint-disable-next-line react/no-array-index-key -- a draft has no ids yet
							<View key={`${step.name}-${index}`} style={styles.step}>
								<ProductImage photo={product?.photo ?? null} size={40} radius={12} />
								<View style={styles.flex}>
									<PoText variant="row15">{step.name}</PoText>
									<PoText variant="meta13" tone="textTertiary">
										{[
											AREA_LABELS[step.area],
											step.detail,
											step.days.length ? step.days.map((day) => WEEKDAYS[day]).join(", ") : "",
										]
											.filter(Boolean)
											.join(" · ")}
									</PoText>
									{step.howTo ? (
										<PoText variant="meta13" tone="textSecondary">
											{step.howTo}
										</PoText>
									) : null}
								</View>
							</View>
						);
					})}
				</View>
			))}
			{plan.habits.length > 0 ? (
				<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
					<PoText variant="title18">Daily habits</PoText>
					{plan.habits.map((habit) => (
						<PoText key={habit.name} variant="row15">
							{habit.name}
							<PoText variant="meta13" tone="textTertiary">
								{habit.detail ? `  ${habit.detail}` : ""}
							</PoText>
						</PoText>
					))}
				</View>
			) : null}
			{plan.areas.length > 0 ? (
				<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
					<PoText variant="title18">Body areas</PoText>
					{plan.areas.map((area) => (
						<View key={area.name}>
							<PoText variant="row15">{area.name}</PoText>
							<PoText
								variant="meta13"
								tone="textSecondary"
							>{`${area.issue} · ${area.care}`}</PoText>
						</View>
					))}
				</View>
			) : null}
			{plan.products.length > 0 ? (
				<PoText variant="meta13" tone="textTertiary">
					{`${plan.products.length} product${plan.products.length === 1 ? "" : "s"} go on your shelf, unless you already have one with the same name.`}
				</PoText>
			) : null}
			{error ? (
				<PoText variant="meta13" tone="textDanger">
					{error}
				</PoText>
			) : null}
			<PillButton
				label={busy ? "Adding…" : hasRoutine ? "Add to my routine" : "Use this"}
				disabled={busy}
				onPress={() => apply("add")}
			/>
			{hasRoutine && plan.steps.length > 0 ? (
				<PillButton
					label="Replace my steps with this"
					variant="secondary"
					disabled={busy}
					onPress={() =>
						showDialog(
							"Replace your steps?",
							"Your current steps and habits go; your shelf and history stay.",
							[
								{ text: "Cancel", style: "cancel" },
								{ text: "Replace", style: "destructive", onPress: () => apply("replace") },
							],
						)
					}
				/>
			) : null}
			<PoText variant="meta13" tone="textTertiary">
				Every step stays yours: change, move or delete any of them after.
			</PoText>
		</View>
	);
}

const styles = StyleSheet.create({
	root: { gap: 12 },
	card: { gap: 12, padding: 16, borderRadius: 20 },
	step: { flexDirection: "row", gap: 12 },
	flex: { flex: 1, gap: 2, minWidth: 0 },
});
