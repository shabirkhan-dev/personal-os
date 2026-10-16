import { router } from "expo-router";
import { ScreenTitle } from "@/components/module-ui";
import { useDailyToday } from "../hooks/use-daily";
import { DailyScreen } from "./daily-screen";
import { MinimumPicker } from "./minimum-picker";

/** Change the minimum day. */
export function MinimumScreen() {
	const { data, sources } = useDailyToday();
	return (
		<DailyScreen>
			<ScreenTitle eyebrow="Daily life · what the OS protects" title="Minimum day" />
			<MinimumPicker settings={data.settings} sources={sources} onSaved={() => router.back()} />
		</DailyScreen>
	);
}
