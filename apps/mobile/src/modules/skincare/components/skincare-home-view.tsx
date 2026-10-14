import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { AskBar } from "@/modules/home/components/ask-bar";
import type { HomeModuleViewProps } from "@/modules/home/lib/module-home";
import { dayKey, newId } from "@/lib/day";
import { haptics } from "@/lib/haptics";
import { parseSkincareAsk } from "../lib/parse-ask";
import { productUsage } from "../lib/products";
import { completeRoutine, routineFor, setRoutine, toggleStep } from "../lib/routine";
import { checkedAgoLabel, latestCheckIn, skinTip } from "../lib/skin";
import { takeSkinPhoto } from "../lib/skin-photo";
import { emptyDay, type Product, type RoutineKind, type Step } from "../lib/skincare-types";
import { useNow } from "../hooks/use-now";
import { useSkincareStore } from "../store/skincare-store";
import { type CheckInDraft, CheckInSheet } from "./check-in-sheet";
import { EditRoutineSheet } from "./edit-routine-sheet";
import { type ProductDraft, ProductSheet } from "./product-sheet";
import { ProductsCard } from "./products-card";
import { RoutineCard } from "./routine-card";
import { RoutineToggle } from "./routine-toggle";
import { SkinTodayCard } from "./skin-today-card";
import { TipRow } from "./tip-row";

type OpenSheet =
	| { kind: "none" }
	| { kind: "routine" }
	| { kind: "check-in"; photoUri?: string }
	| { kind: "product"; name: string };

/** Skincare Home: routine toggle and steps, skin check, products, a tip and the ask bar. */
export function SkincareHomeView({ actionRequest }: HomeModuleViewProps) {
	const doc = useSkincareStore((state) => state.data);
	const hydrate = useSkincareStore((state) => state.hydrate);
	const update = useSkincareStore((state) => state.update);
	const [kind, setKind] = useState<RoutineKind>(() => routineFor(new Date()));
	const [sheet, setSheet] = useState<OpenSheet>({ kind: "none" });
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		hydrate().catch((error: unknown) => console.error("Could not load skincare", error));
	}, [hydrate]);

	const now = useNow();
	const today = dayKey(now);
	const day = doc.completions[today] ?? emptyDay();
	const latest = latestCheckIn(doc.checkIns);
	const todayCheckIn = doc.checkIns.find((checkIn) => checkIn.dayKey === today) ?? null;
	const tip = useMemo(() => skinTip(doc), [doc]);
	// Today's check-in to edit, or the last values without the old photo.
	const checkInStart = useMemo<CheckInDraft | null>(() => {
		if (todayCheckIn) return todayCheckIn;
		if (!latest) return null;
		return { hydration: latest.hydration, redness: latest.redness, breakouts: latest.breakouts };
	}, [todayCheckIn, latest]);
	const rows = doc.products.map((product) => ({ product, usage: productUsage(product, now) }));

	const close = () => setSheet({ kind: "none" });

	const startPhoto = useCallback(async () => {
		setBusy(true);
		const result = await takeSkinPhoto(dayKey());
		setBusy(false);
		if (result.status === "taken") setSheet({ kind: "check-in", photoUri: result.uri });
		else if (result.status === "denied") {
			Alert.alert(
				"Camera is off",
				"Allow camera access in Settings to take skin photos. You can still log how your skin feels.",
				[
					{ text: "Not now", style: "cancel" },
					{ text: "Log without photo", onPress: () => setSheet({ kind: "check-in" }) },
				],
			);
		} else if (result.status === "failed") {
			Alert.alert("Could not take the photo", "You can still log how your skin feels.", [
				{ text: "Cancel", style: "cancel" },
				{ text: "Log skin", onPress: () => setSheet({ kind: "check-in" }) },
			]);
		}
	}, []);

	const runPhoto = useCallback(() => {
		startPhoto().catch((error: unknown) => console.error("Skin photo flow failed", error));
	}, [startPhoto]);

	// The header camera button.
	const lastRequest = useRef(actionRequest);
	useEffect(() => {
		if (actionRequest === lastRequest.current) return;
		lastRequest.current = actionRequest;
		runPhoto();
	}, [actionRequest, runPhoto]);

	const markRoutineDone = () => {
		const current = routineFor(new Date());
		setKind(current);
		if (doc.routines[current].length === 0) {
			setSheet({ kind: "routine" });
			return;
		}
		update((d) => completeRoutine(d, current, new Date()));
		haptics.success();
	};

	const saveCheckIn = (draft: CheckInDraft) => {
		update((d) => {
			const others = d.checkIns.filter((checkIn) => checkIn.dayKey !== today);
			const id = todayCheckIn?.id ?? newId();
			return { ...d, checkIns: [...others, { id, dayKey: today, ...draft }] };
		});
		haptics.success();
		close();
	};

	const saveProduct = (draft: ProductDraft) => {
		update((d) => ({ ...d, products: [...d.products, { id: newId(), ...draft }] }));
		haptics.success();
		close();
	};

	const reorder = (product: Product) =>
		Alert.alert(`Restocked ${product.name}?`, "This starts a new bottle from today.", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Restocked",
				onPress: () =>
					update((d) => ({
						...d,
						products: d.products.map((p) =>
							p.id === product.id ? { ...p, startedAt: dayKey() } : p,
						),
					})),
			},
		]);

	const remove = (product: Product) =>
		Alert.alert(`Remove ${product.name}?`, "It will no longer be tracked.", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Remove",
				style: "destructive",
				onPress: () =>
					update((d) => ({ ...d, products: d.products.filter((p) => p.id !== product.id) })),
			},
		]);

	const onAsk = (text: string) => {
		const ask = parseSkincareAsk(text);
		if (ask.kind === "complete-routine") markRoutineDone();
		else if (ask.kind === "add-product") setSheet({ kind: "product", name: ask.name });
		else setSheet({ kind: "check-in" });
	};

	const routineLabel =
		routineFor(now) === "morning" ? "Done morning routine" : "Done night routine";

	return (
		<View style={styles.column}>
			<RoutineToggle value={kind} onChange={setKind} />
			<RoutineCard
				kind={kind}
				steps={doc.routines[kind]}
				done={day[kind]}
				onToggle={(stepId) => update((d) => toggleStep(d, kind, stepId, new Date()))}
				onEdit={() => setSheet({ kind: "routine" })}
			/>
			<SkinTodayCard
				latest={latest}
				checkedLabel={checkedAgoLabel(latest, now)}
				busy={busy}
				onTakePhoto={runPhoto}
				onLog={() => setSheet({ kind: "check-in" })}
			/>
			<ProductsCard
				rows={rows}
				onAdd={() => setSheet({ kind: "product", name: "" })}
				onReorder={reorder}
				onRemove={remove}
			/>
			<TipRow parts={tip} />
			<AskBar
				placeholder="Log skin or add a product…"
				suggestions={[
					{ label: routineLabel, onPress: markRoutineDone },
					{ label: "Add product", onPress: () => setSheet({ kind: "product", name: "" }) },
					{ label: "Log skin", onPress: () => setSheet({ kind: "check-in" }) },
				]}
				onSubmit={onAsk}
			/>
			<EditRoutineSheet
				visible={sheet.kind === "routine"}
				kind={kind}
				steps={doc.routines[kind]}
				onClose={close}
				onSave={(steps: Step[]) => {
					update((d) => setRoutine(d, kind, steps, new Date()));
					close();
				}}
			/>
			<CheckInSheet
				visible={sheet.kind === "check-in"}
				initial={checkInStart}
				photoUri={sheet.kind === "check-in" ? sheet.photoUri : undefined}
				onClose={close}
				onSave={saveCheckIn}
			/>
			<ProductSheet
				visible={sheet.kind === "product"}
				initialName={sheet.kind === "product" ? sheet.name : ""}
				onClose={close}
				onSave={saveProduct}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	column: { gap: 16 },
});
