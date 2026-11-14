import { Platform } from "react-native";
import {
	registerWidgetTaskHandler,
	requestWidgetUpdate,
	type WidgetTaskHandlerProps,
} from "react-native-android-widget";
import { listItems } from "@/lib/db/collection";
import { dayKey } from "@/lib/day";
import { tasbihDays } from "@/modules/faith/data/collections";
import { saveTasbih } from "@/modules/faith/data/faith-actions";
import { addWater } from "@/modules/food/data/food-actions";
import {
	ADD_WATER,
	GLASS_ML,
	renderWidget,
	TASBIH_TAP,
	WIDGET_NAMES,
} from "../components/home-widgets";
import { loadWidgetSnapshot } from "../lib/widget-data";

/**
 * The widgets' background task: draws them when added, resized or due an update, and runs their
 * buttons (+250 ml, tasbih tap) without opening the app, then redraws every widget so they agree.
 */

async function countTasbih(): Promise<void> {
	const snapshot = await loadWidgetSnapshot();
	const today = dayKey(new Date());
	const stored = (await listItems(tasbihDays)).find((day) => day.id === today);
	const counts = stored?.counts ?? {};
	const id = snapshot.tasbih.phraseId;
	await saveTasbih({ id: today, counts: { ...counts, [id]: (counts[id] ?? 0) + 1 } });
}

async function handleWidget(props: WidgetTaskHandlerProps): Promise<void> {
	if (props.widgetAction === "WIDGET_DELETED") return;
	if (props.widgetAction === "WIDGET_CLICK") {
		if (props.clickAction === ADD_WATER) await addWater(GLASS_ML);
		if (props.clickAction === TASBIH_TAP) await countTasbih();
	}
	const now = new Date();
	const data = await loadWidgetSnapshot(now);
	props.renderWidget(renderWidget(props.widgetInfo.widgetName, data, now));
	if (props.widgetAction === "WIDGET_CLICK") await refreshWidgets(props.widgetInfo.widgetName);
}

/** Redraws every placed widget (except `skip`, already drawn) from what's saved now. */
export async function refreshWidgets(skip?: string): Promise<void> {
	if (Platform.OS !== "android") return;
	const now = new Date();
	const data = await loadWidgetSnapshot(now);
	await Promise.all(
		WIDGET_NAMES.filter((name) => name !== skip).map((name) =>
			requestWidgetUpdate({ widgetName: name, renderWidget: () => renderWidget(name, data, now) }),
		),
	);
}

export function registerWidgets(): void {
	if (Platform.OS !== "android") return;
	registerWidgetTaskHandler(async (props) => {
		try {
			await handleWidget(props);
		} catch (error) {
			console.error(`[widgets] ${props.widgetInfo.widgetName} failed`, error);
		}
	});
}
