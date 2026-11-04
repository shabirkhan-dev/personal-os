import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { startConversation, useAssistant } from "@/modules/assistant";
import { CalendarWeekCard } from "@/modules/calendar/components/calendar-week-card";
import { careHome, useCareStatus } from "@/modules/care";
import { careerHome, useCareerStatus } from "@/modules/career";
import { DailyOverview, dailyRoutes, useDailyLine, useDailyStatus } from "@/modules/daily";
import { faithHome, useFaithStatus } from "@/modules/faith";
import { fashionHome, useFashionStatus } from "@/modules/fashion";
import { foodHome, useFoodStatus } from "@/modules/food";
import { financeHome, useFinanceStatus } from "@/modules/finance";
import { AskBar } from "@/modules/home/components/ask-bar";
import { FloatingTabBar } from "@/modules/home/components/floating-tab-bar";
import { HomeHeader } from "@/modules/home/components/home-header";
import { ModulePicker } from "@/modules/home/components/module-picker";
import { SectionsMenu } from "@/modules/home/components/sections-menu";
import { sectionsFor } from "@/modules/home/lib/module-sections";
import { SoonView } from "@/modules/home/components/soon-view";
import type { HomeHero, HomeModule } from "@/modules/home/lib/module-home";
import { routeLine } from "@/modules/home/lib/route-line";
import { insightsTabPress } from "@/modules/home/components/insights-switcher";
import { setAreasOpen, useAreasPicker } from "@/modules/home/store/areas-picker";
import { moduleStatuses, todayItems } from "@/modules/home/lib/today";
import { useAskInbox } from "@/modules/home/store/ask-inbox";
import { type HomeView, useHomeView } from "@/modules/home/store/home-view";
import type { ModuleId } from "@/modules/onboarding/lib/options";
import { moduleOptions } from "@/modules/onboarding/lib/options";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usePlan } from "@/modules/onboarding/store/use-plan";
import { useWishlistStatus, wishlistHome } from "@/modules/wishlist";
import { useWorkoutStatus, workoutHome } from "@/modules/workout";
import { KeyboardAwareScrollView } from "@/components/ui/keyboard-aware-scroll-view";
import { PoText } from "@/components/ui/po-text";
import { useNow } from "@/lib/use-now";
import { voiceOut } from "@/lib/voice";
import { usePoTheme } from "@/theme";

const HEADER_HEIGHT = 66;

const moduleHomes: Partial<Record<ModuleId, HomeModule>> = {
	career: careerHome,
	finance: financeHome,
	workout: workoutHome,
	skincare: careHome,
	food: foodHome,
	faith: faithHome,
	fashion: fashionHome,
	wishlist: wishlistHome,
};

/** Today: Overview or one module's Home, switched from the module picker. */
export default function TodayScreen() {
	const { colors } = usePoTheme();
	const insets = useSafeAreaInsets();
	const now = useNow();
	const plan = usePlan();
	const { answers } = plan;
	const toggleModule = useOnboardingStore((state) => state.toggleModule);
	const { persistAnswers } = useOnboardingProgress();
	const { data: viewDoc, hydrate, update } = useHomeView();
	const pickerOpen = useAreasPicker((state) => state.open);
	const [sectionsOpen, setSectionsOpen] = useState(false);

	useEffect(() => {
		void hydrate();
	}, [hydrate]);

	const items = useMemo(
		() => todayItems(plan.input, answers.reminders),
		[plan.input, answers.reminders],
	);

	// Every module's hero is read on each render so the hooks stay in a fixed order.
	const heroes: Partial<Record<ModuleId, HomeHero>> = {
		career: careerHome.useHero(),
		finance: financeHome.useHero(),
		workout: workoutHome.useHero(),
		skincare: careHome.useHero(),
		food: foodHome.useHero(),
		faith: faithHome.useHero(),
		fashion: fashionHome.useHero(),
		wishlist: wishlistHome.useHero(),
	};
	const liveStatus: Partial<Record<ModuleId, string>> = {
		"daily-life": useDailyStatus(),
		career: useCareerStatus(),
		finance: useFinanceStatus(),
		workout: useWorkoutStatus(),
		skincare: useCareStatus(),
		food: useFoodStatus(),
		faith: useFaithStatus(),
		fashion: useFashionStatus(),
		wishlist: useWishlistStatus(),
	};
	const modules = moduleStatuses(plan.input, items);
	for (const item of modules) item.status = liveStatus[item.id] ?? item.status;

	// A module turned off elsewhere, or one without its own Home, falls back to Overview.
	const view: HomeView =
		viewDoc.view !== "overview" &&
		(!answers.modules.includes(viewDoc.view) || !moduleHomes[viewDoc.view])
			? "overview"
			: viewDoc.view;
	const moduleHome = view === "overview" ? undefined : moduleHomes[view];

	const select = (target: HomeView) => {
		update((doc) => ({ ...doc, view: target }));
		setAreasOpen(false);
	};

	const addModule = (id: ModuleId) => {
		toggleModule(id);
		persistAnswers().catch((error: unknown) => console.error("Could not save modules", error));
	};

	const togglePicker = () => {
		setSectionsOpen(false);
		setAreasOpen(!pickerOpen);
	};
	const moduleLabel =
		view === "overview"
			? "Overview"
			: (moduleOptions.find((option) => option.id === view)?.label ?? "Module");
	const sections = sectionsFor(moduleLabel);
	const openSections =
		sections.length > 0
			? () => {
					setAreasOpen(false);
					setSectionsOpen(true);
				}
			: undefined;
	const toggleHidden = () => update((doc) => ({ ...doc, amountsHidden: !doc.amountsHidden }));

	return (
		<View style={[styles.root, { backgroundColor: colors.bgApp }]}>
			<KeyboardAwareScrollView
				contentContainerStyle={[styles.scroll, { paddingBottom: 110 + insets.bottom }]}
				keyboardShouldPersistTaps="handled"
			>
				{moduleHome && view !== "overview" ? (
					<ModuleScreen
						key={view}
						module={moduleHome}
						hero={heroes[view]}
						label={moduleLabel}
						name={answers.name}
						topInset={insets.top}
						pickerOpen={pickerOpen}
						onAppsPress={togglePicker}
						onPillPress={openSections}
						amountsHidden={viewDoc.amountsHidden}
						onToggleHidden={toggleHidden}
					/>
				) : (
					<>
						<HomeHeader
							name={answers.name}
							topInset={insets.top}
							label={answers.name.trim().split(/\s+/)[0] || "You"}
							glow="accentDefault"
							pickerOpen={pickerOpen}
							onAppsPress={togglePicker}
							onPillPress={openSections}
							action={{ icon: "Sun", label: "Morning brief", onPress: dailyRoutes.brief }}
						/>
						<View style={styles.content}>
							{view === "overview" ? (
								<OverviewBody
									name={answers.name}
									now={now}
									modules={answers.modules}
									amountsHidden={viewDoc.amountsHidden}
									onOpen={select}
								/>
							) : (
								<SoonView
									icon={view === "fashion" ? "Shirt" : "Filled/Grid"}
									title={`${moduleOptions.find((option) => option.id === view)?.label ?? "This module"} is coming`}
									body="Its own Home is being built. Your plan for it still shows on Overview."
									onBack={() => select("overview")}
								/>
							)}
						</View>
					</>
				)}
			</KeyboardAwareScrollView>
			{pickerOpen ? (
				<ModulePicker
					top={insets.top + HEADER_HEIGHT}
					view={view}
					modules={modules}
					onClose={() => setAreasOpen(false)}
					onSelect={select}
					onAddModule={addModule}
					onEdit={() => {
						setAreasOpen(false);
						router.push("/profile");
					}}
				/>
			) : null}
			{sectionsOpen ? (
				<SectionsMenu
					top={insets.top + HEADER_HEIGHT}
					title={moduleLabel}
					sections={sections}
					onClose={() => setSectionsOpen(false)}
				/>
			) : null}
			<FloatingTabBar
				active="today"
				bottomInset={insets.bottom}
				onTodayPress={() => select("overview")}
				onInsightsPress={moduleHome?.onInsights ?? insightsTabPress()}
				onProfilePress={() => {
					setAreasOpen(false);
					router.push("/profile");
				}}
			/>
		</View>
	);
}

type ModuleScreenProps = {
	module: HomeModule;
	hero?: HomeHero;
	label: string;
	name: string;
	topInset: number;
	pickerOpen: boolean;
	onAppsPress: () => void;
	onPillPress?: () => void;
	amountsHidden: boolean;
	onToggleHidden: () => void;
};

/** One module's Home. Keyed by module so its view starts fresh when switching. */
function ModuleScreen({ module, hero, label, ...header }: ModuleScreenProps) {
	const [actionRequest, setActionRequest] = useState(0);
	const { View: ModuleView, Backdrop } = module;

	return (
		<>
			<HomeHeader
				{...header}
				label={label}
				glow={hero?.glow ?? module.glow}
				hero={hero}
				backdrop={Backdrop ? <Backdrop /> : null}
				action={{
					icon: module.action.icon,
					label: module.action.label,
					onPress: () => setActionRequest((count) => count + 1),
				}}
			/>
			<View style={styles.content}>
				<ModuleView actionRequest={actionRequest} />
			</View>
		</>
	);
}

type OverviewBodyProps = {
	name: string;
	now: Date;
	modules: readonly ModuleId[];
	amountsHidden: boolean;
	onOpen: (view: HomeView) => void;
};

/**
 * Overview, the day's hub: a greeting, the ask bar, what's next, the day's numbers, one timeline
 * and the week's calendar.
 */
function OverviewBody({ name, now, modules, amountsHidden, onOpen }: OverviewBodyProps) {
	const hour = now.getHours();
	const first = name.trim().split(/\s+/)[0];
	const greeting = `${hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"}${first ? `, ${first}` : ""}`;
	const period = now.toLocaleDateString("en-GB", {
		weekday: "long",
		day: "numeric",
		month: "long",
	});
	const send = useAskInbox((state) => state.send);
	const [notice, setNotice] = useState<string | null>(null);
	const say = (text: string, spoken: boolean) => {
		setNotice(text);
		if (spoken) voiceOut.speak(text);
	};
	const dayLine = useDailyLine(say);
	const assistant = useAssistant();

	// The day's own lines (sleep, "what's next", ticking the minimum day) are handled here; any
	// other line goes to the module it belongs to, which logs or answers it.
	const ask = (text: string, spoken: boolean) => {
		if (dayLine(text, spoken)) return;
		const target = routeLine(text, modules);
		if (!target || target === "daily-life") {
			// Questions and anything else go to the assistant, which answers from the person's data.
			if (!assistant.available) {
				say("Say which part of your day it's for, like a meal, a prayer or money spent.", spoken);
				return;
			}
			setNotice(null);
			startConversation({ screen: "overview" });
			assistant.send(text);
			router.push("/assistant");
			return;
		}
		setNotice(null);
		send({ module: target, text, spoken });
		onOpen(target);
	};

	const suggestions = [
		modules.includes("career") ? { label: "Log a job", onPress: () => onOpen("career") } : null,
		modules.includes("food") ? { label: "Log a meal", onPress: () => onOpen("food") } : null,
		modules.includes("finance")
			? { label: "Log spending", onPress: () => onOpen("finance") }
			: null,
		modules.includes("workout")
			? { label: "Start workout", onPress: () => onOpen("workout") }
			: null,
		modules.includes("skincare") ? { label: "Care", onPress: () => onOpen("skincare") } : null,
		modules.includes("faith") ? { label: "Log a prayer", onPress: () => onOpen("faith") } : null,
		modules.includes("fashion")
			? { label: "What to wear", onPress: () => onOpen("fashion") }
			: null,
	].filter((item): item is { label: string; onPress: () => void } => item !== null);

	return (
		<>
			<View style={styles.greeting}>
				<PoText variant="title30">{greeting}</PoText>
				<PoText variant="body15" tone="textSecondary">
					{period}
				</PoText>
			</View>
			<AskBar suggestions={suggestions.slice(0, 4)} onSubmit={ask} />
			{notice ? (
				<PoText variant="meta13" tone="textSecondary" style={styles.notice}>
					{notice}
				</PoText>
			) : null}
			<DailyOverview onOpen={onOpen} onNotice={setNotice} amountsHidden={amountsHidden} />
			<CalendarWeekCard />
		</>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	scroll: { flexGrow: 1 },
	content: { gap: 16, paddingHorizontal: 16 },
	notice: { paddingHorizontal: 4 },
	greeting: { gap: 4, paddingHorizontal: 4, paddingBottom: 4 },
});
