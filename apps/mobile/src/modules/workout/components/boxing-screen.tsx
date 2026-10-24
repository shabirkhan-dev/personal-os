import { useKeepAwake } from "expo-keep-awake";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { EmptyCard, Footer, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { useNow } from "@/lib/use-now";
import { voiceOut } from "@/lib/voice";
import { usePoTheme } from "@/theme";
import { startSession } from "../hooks/live-actions";
import { useLiveSession } from "../hooks/live-store";
import { COMBO_WORDS, COMBOS, ROUND_FOCUS, templateById } from "../lib/library";
import { clockTime, roundAt } from "../lib/training-math";
import { Card } from "./home-cards";
import { FinishSheet } from "./finish-sheet";
import { TrainingScreen } from "./training-screen";

const CALL_EVERY_S = 20;

/** Boxing rounds: a work/rest ring, round segments, call-outs read aloud and a focus per round. */
export function BoxingScreen() {
	useKeepAwake();
	const { colors } = usePoTheme();
	const live = useLiveSession((state) => state.data);
	const hydrated = useLiveSession((state) => state.hydrated);
	const hydrate = useLiveSession((state) => state.hydrate);
	const update = useLiveSession((state) => state.update);
	const now = useNow(500);
	const [finishing, setFinishing] = useState(false);
	const template = live?.snapshot ?? templateById(live?.template);

	useEffect(() => {
		void hydrate();
	}, [hydrate]);

	const rounds = template?.rounds ?? 6;
	const workS = (template?.roundMin ?? 3) * 60;
	const restS = (template?.restMin ?? 1) * 60;
	const elapsed = live
		? Math.max(
				0,
				Math.round(((live.pausedAtMs ?? now.getTime()) - live.startedAtMs - live.pausedMs) / 1000),
			)
		: 0;
	const state = roundAt(elapsed, rounds, workS, restS);
	const combo =
		COMBOS[(state.round * 2 + Math.floor(state.withinWork / CALL_EVERY_S)) % COMBOS.length] ??
		COMBOS[0] ??
		[];

	// Speak each new call-out and each round change once.
	const spoken = useRef("");
	useEffect(() => {
		if (!live || live.pausedAtMs) return;
		const cue = state.done
			? "done"
			: state.work
				? `w${state.round}-${Math.floor(state.withinWork / CALL_EVERY_S)}`
				: `r${state.round}`;
		if (cue === spoken.current) return;
		spoken.current = cue;
		if (state.done) {
			haptics.success();
			voiceOut.speak("Last round done. Great work.");
		} else if (!state.work) {
			haptics.tap();
			voiceOut.speak(`Rest. Round ${state.round + 1} next.`);
		} else {
			voiceOut.speak(combo.map((word) => COMBO_WORDS[word] ?? word).join(", "));
		}
	}, [live, state.done, state.work, state.round, state.withinWork, combo]);

	if (!hydrated) return <TrainingScreen>{null}</TrainingScreen>;
	if (!live || !template || template.sport !== "boxing") {
		return (
			<TrainingScreen>
				<EmptyCard
					icon="Clock"
					title="Rounds timer"
					body={`${rounds} rounds of ${workS / 60} min with ${restS / 60} min rest, call-outs read aloud.`}
				>
					<PillButton label="Start shadow boxing" onPress={() => startSession("shadow-boxing")} />
				</EmptyCard>
			</TrainingScreen>
		);
	}

	const size = 240;
	const width = 10;
	const radius = (size - width) / 2;
	const length = 2 * Math.PI * radius;
	const share = state.work ? state.left / workS : state.left / restS;
	const tone = state.work ? colors.statusDanger : colors.statusSuccess;
	const paused = live.pausedAtMs !== null;

	return (
		<TrainingScreen
			action={{ icon: "Filled/Edit", label: "End session", onPress: () => setFinishing(true) }}
		>
			<ScreenTitle
				eyebrow={`Shadow boxing · ${rounds} × ${workS / 60} min`}
				title={state.done ? "Done" : `Round ${state.round}`}
			/>
			<Card>
				<View style={styles.ringBox}>
					<View
						style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
					>
						<Svg width={size} height={size} style={StyleSheet.absoluteFill}>
							<Circle
								cx={size / 2}
								cy={size / 2}
								r={radius}
								stroke={colors.bgSubtle}
								strokeWidth={width}
								fill="none"
							/>
							<Circle
								cx={size / 2}
								cy={size / 2}
								r={radius}
								stroke={tone}
								strokeWidth={width}
								strokeLinecap="round"
								fill="none"
								strokeDasharray={`${length * share} ${length}`}
								transform={`rotate(-90 ${size / 2} ${size / 2})`}
							/>
						</Svg>
						<PoText variant="eyebrow11" tone={state.work ? "textDanger" : "textSuccess"}>
							{state.done
								? "All rounds done"
								: `${state.work ? "Work" : "Rest"} · round ${state.round} of ${rounds}`}
						</PoText>
						<PoText variant="hero40" style={styles.time}>
							{clockTime(state.left)}
						</PoText>
						<PoText variant="meta13" tone="textSecondary">
							{state.work ? `${restS / 60}:00 rest next` : "Hands up, breathe"}
						</PoText>
					</View>
				</View>
				<View style={styles.segments}>
					{Array.from({ length: rounds }, (_, index) => index).map((index) => (
						<View
							key={index}
							style={[
								styles.segment,
								{
									backgroundColor:
										index < state.round - 1 || state.done
											? colors.statusDanger
											: index === state.round - 1
												? colors.textPrimary
												: colors.bgSubtle,
								},
							]}
						/>
					))}
				</View>
			</Card>
			{state.work && !state.done ? (
				<Card>
					<PoText variant="eyebrow11" tone="textTertiary">
						{`Call out · every ${CALL_EVERY_S} s`}
					</PoText>
					<View style={styles.combo}>
						{combo.map((word, index) => (
							// oxlint-disable-next-line react/no-array-index-key -- a combo repeats punches
							<View
								key={`${word}-${index}`}
								style={[styles.punch, { backgroundColor: colors.bgSubtle }]}
							>
								<PoText variant="title18" tone={/\d/.test(word) ? "textPrimary" : "textWarning"}>
									{word}
								</PoText>
							</View>
						))}
					</View>
					<PoText variant="meta13" tone="textSecondary">
						{`${combo.map((word) => COMBO_WORDS[word] ?? word).join(", ")}. Voice reads it out.`}
					</PoText>
				</Card>
			) : null}
			<Card>
				<PoText variant="title18">This round's focus</PoText>
				<PoText variant="meta13" tone="textSecondary">
					{ROUND_FOCUS[(state.round - 1) % ROUND_FOCUS.length]}
				</PoText>
			</Card>
			<Footer>
				<PillButton
					label={paused ? "Resume" : "Pause"}
					variant="secondary"
					style={styles.flex}
					onPress={() => {
						haptics.tap();
						update((current) =>
							current
								? current.pausedAtMs
									? {
											...current,
											pausedMs: current.pausedMs + (Date.now() - current.pausedAtMs),
											pausedAtMs: null,
										}
									: { ...current, pausedAtMs: Date.now() }
								: current,
						);
					}}
				/>
				<PillButton label="End session" style={styles.flex} onPress={() => setFinishing(true)} />
			</Footer>
			<FinishSheet
				visible={finishing}
				live={live}
				template={template}
				rounds={state.done ? rounds : Math.max(1, state.round - (state.work ? 1 : 0))}
				onClose={() => setFinishing(false)}
			/>
		</TrainingScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	ringBox: { alignItems: "center", paddingVertical: 8 },
	time: { fontSize: 64, lineHeight: 72 },
	segments: { flexDirection: "row", gap: 6 },
	segment: { flex: 1, height: 6, borderRadius: 3 },
	combo: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	punch: {
		minWidth: 44,
		height: 48,
		paddingHorizontal: 12,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
});
