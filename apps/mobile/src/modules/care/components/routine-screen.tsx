import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Footer, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { haptics } from "@/lib/haptics";
import { useSpeaker } from "@/lib/voice";
import { skip, tick } from "../data/care-actions";
import { useCareToday } from "../hooks/use-care";
import { stepsOn } from "../lib/care-math";
import type { Routine, Step } from "../lib/care-model";
import { careRoutes } from "../navigation";
import { CareScreen } from "./care-screen";
import { Banner, Card, CardHead, StepRow } from "./home-cards";
import { ProductImage } from "./product-image";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Morning or night routine: the steps by area with their products, Start to go one by one. */
export function RoutineScreen({ routine }: { routine: Routine }) {
	const { data, today, record, now } = useCareToday();
	const { steps, products, settings } = data;
	const speaker = useSpeaker();
	const list = stepsOn(steps, routine, today);
	const all = steps.filter((step) => step.routine === routine);
	const [guided, setGuided] = useState(false);
	const [open, setOpen] = useState<Step | null>(null);
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

	const edit = (step: Step) => careRoutes.step(routine, step.id);

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
				onPress: () => careRoutes.step(routine),
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
						{all.length === 0
							? `Your ${routine} routine is empty. Add your own steps with the pencil, or start from a template.`
							: `Nothing in the ${routine} routine today.`}
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
									onInfo={() => setOpen(step)}
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
				Tap to tick. The i shows how to apply it; long press to change it.
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

			<Sheet visible={open !== null} title={open?.name ?? ""} onClose={() => setOpen(null)}>
				{open ? (
					<View style={styles.sheet}>
						{open.photos.length > 0 ? (
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={styles.photos}
							>
								{open.photos.map((photo) => (
									<ProductImage key={photo} photo={photo} size={200} radius={20} />
								))}
							</ScrollView>
						) : null}
						{open.detail ? (
							<PoText variant="row15" tone="textSecondary">
								{open.detail}
							</PoText>
						) : null}
						<PoText variant="body15">
							{open.howTo ||
								"No instructions yet. Edit the step to add how you apply it, or a photo."}
						</PoText>
						{productOf(open) ? (
							<View style={styles.product}>
								<ProductImage photo={productOf(open)?.photo ?? null} size={40} radius={12} />
								<PoText variant="meta13" tone="textSecondary">
									{`Uses ${productOf(open)?.name ?? ""}`}
								</PoText>
							</View>
						) : null}
						<PillButton
							label="Edit step"
							variant="secondary"
							onPress={() => {
								const step = open;
								setOpen(null);
								edit(step);
							}}
						/>
					</View>
				) : null}
			</Sheet>
		</CareScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	hint: { paddingHorizontal: 8 },
	sheet: { gap: 12 },
	photos: { gap: 8 },
	product: { flexDirection: "row", alignItems: "center", gap: 12 },
});
