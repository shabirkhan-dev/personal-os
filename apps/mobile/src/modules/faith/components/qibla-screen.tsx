import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, G, Line, Path, Polygon, Text as SvgText } from "react-native-svg";
import { EmptyCard, MetaChip, ScreenTitle } from "@/components/module-ui";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { useFaith } from "../hooks/use-faith";
import { compassPoint, distanceToMakkah, qiblaBearing, turnBetween } from "../lib/prayer-times";
import { useFaithUi } from "../hooks/faith-ui-store";
import { locateLabel, useLocate } from "../hooks/locate-store";
import { LocateStatus } from "./faith-sheets";
import { faithRoutes } from "../navigation";
import { FaithScreen } from "./faith-screen";

const SIZE = 320;
const CENTER = SIZE / 2;
const ALIGNED_DEGREES = 5;
/** Without a reading by then, the compass is treated as missing (the bearing is still shown). */
const COMPASS_WAIT_MS = 6000;
const TICKS = Array.from({ length: 72 }, (_, step) => step * 5);

type Heading = { degrees: number; accuracy: number };

/** Follows the compass. Null until the first reading, or when the phone has no compass. */
function useHeading(enabled: boolean): { heading: Heading | null; unavailable: boolean } {
	const [heading, setHeading] = useState<Heading | null>(null);
	const [unavailable, setUnavailable] = useState(Platform.OS === "web");

	useEffect(() => {
		if (!enabled || Platform.OS === "web") return;
		let subscription: Location.LocationSubscription | null = null;
		let cancelled = false;
		let heard = false;
		const wait = setTimeout(() => {
			if (!heard) setUnavailable(true);
		}, COMPASS_WAIT_MS);
		// The heading needs the location permission on Android; asking again is instant once given.
		Location.requestForegroundPermissionsAsync()
			.then((permission) => {
				if (!permission.granted) throw new Error("location permission denied");
				return Location.watchHeadingAsync((reading) => {
					const degrees = reading.trueHeading >= 0 ? reading.trueHeading : reading.magHeading;
					if (degrees < 0) return;
					heard = true;
					setUnavailable(false);
					setHeading({ degrees, accuracy: reading.accuracy });
				});
			})
			.then((sub) => {
				if (cancelled) sub.remove();
				else subscription = sub;
			})
			.catch((error: unknown) => {
				console.warn("[faith] compass unavailable", error);
				setUnavailable(true);
			});
		return () => {
			cancelled = true;
			clearTimeout(wait);
			subscription?.remove();
		};
	}, [enabled]);

	return { heading, unavailable };
}

/** Qibla: a compass that turns with the phone, the Kaaba in the middle and how far to turn. */
export function QiblaScreen() {
	const { colors, mode } = usePoTheme();
	const { settings } = useFaith();
	const openSheet = useFaithUi((state) => state.openSheet);
	const place = settings.place;
	const { heading, unavailable } = useHeading(place !== null);
	const locating = locateLabel(useLocate((state) => state.stage));
	const error = useLocate((state) => state.error);

	const bearing = place ? qiblaBearing(place) : 0;
	const turn = heading ? turnBetween(heading.degrees, bearing) : null;
	const aligned = turn !== null && Math.abs(turn) <= ALIGNED_DEGREES;

	// A light buzz the moment the phone lines up.
	const wasAligned = useRef(false);
	useEffect(() => {
		if (aligned && !wasAligned.current) haptics.success();
		wasAligned.current = aligned;
	}, [aligned]);

	// The dial turns the opposite way to the phone, along the shortest path.
	const rotation = useSharedValue(0);
	const lastHeading = useRef<number | null>(null);
	useEffect(() => {
		if (!heading) return;
		const previous = lastHeading.current;
		const delta = previous === null ? heading.degrees : turnBetween(previous, heading.degrees);
		lastHeading.current = heading.degrees;
		rotation.value = withTiming(rotation.value - delta, { duration: 160 });
	}, [heading, rotation]);
	const dialStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

	const locate = async () => {
		if (await useLocate.getState().locate(settings)) haptics.success();
	};

	if (!place) {
		return (
			<FaithScreen>
				<ScreenTitle eyebrow="Faith" title="Qibla" />
				<EmptyCard
					icon="Pin"
					title="Find the Qibla"
					body="I need to know where you are once. It stays on this phone and also sets your prayer times."
				>
					<PillButton
						label={locating ?? "Use my location"}
						disabled={locating !== null}
						onPress={() => void locate()}
					/>
					<LocateStatus locating={locating} error={error} />
				</EmptyCard>
			</FaithScreen>
		);
	}

	const headline = !heading
		? unavailable
			? `Face ${Math.round(bearing)}°`
			: "Finding north…"
		: aligned
			? "You're facing the Qibla"
			: `Turn ${Math.round(Math.abs(turn ?? 0))}° ${(turn ?? 0) > 0 ? "right" : "left"}`;
	const offset = Math.max(-1, Math.min(1, (turn ?? 0) / 90));
	const accuracy = heading?.accuracy ?? 0;
	const kaabaFace = mode === "dark" ? colors.bgCanvas : colors.bgInverse;

	return (
		<FaithScreen
			action={{
				icon: "Settings",
				label: "Prayer settings",
				onPress: () => {
					openSheet("setup");
					faithRoutes.today();
				},
			}}
		>
			<ScreenTitle
				eyebrow={`From ${place.name} · ${distanceToMakkah(place).toLocaleString("en-US")} km to Makkah`}
				title="Qibla"
			/>
			<View style={styles.headline}>
				<PoText
					variant="title30"
					tone={aligned ? "textSuccess" : "textPrimary"}
					accessibilityLiveRegion="polite"
				>
					{headline}
				</PoText>
				<PoText variant="text14" tone="textSecondary">
					Qibla is {Math.round(bearing)}° {compassPoint(bearing)}
				</PoText>
			</View>

			<View style={styles.compass} accessibilityLabel={headline}>
				<Svg width={20} height={14} style={styles.pointer}>
					<Polygon
						points="0,0 20,0 10,14"
						fill={aligned ? colors.statusSuccess : colors.accentDefault}
					/>
				</Svg>
				<Animated.View style={[styles.dial, dialStyle]}>
					<Svg width={SIZE} height={SIZE}>
						<Circle
							cx={CENTER}
							cy={CENTER}
							r={CENTER - 2}
							stroke={colors.borderDefault}
							strokeWidth={1}
							fill="none"
						/>
						{TICKS.map((degrees) => {
							const major = degrees % 30 === 0;
							const angle = (degrees * Math.PI) / 180;
							const outer = CENTER - 12;
							const inner = outer - (major ? 14 : 7);
							return (
								<Line
									key={degrees}
									x1={CENTER + inner * Math.sin(angle)}
									y1={CENTER - inner * Math.cos(angle)}
									x2={CENTER + outer * Math.sin(angle)}
									y2={CENTER - outer * Math.cos(angle)}
									stroke={major ? colors.textSecondary : colors.borderStrong}
									strokeWidth={major ? 2 : 1}
									strokeLinecap="round"
								/>
							);
						})}
						{(["N", "E", "S", "W"] as const).map((letter, index) => {
							const angle = (index * Math.PI) / 2;
							const r = CENTER - 46;
							return (
								<SvgText
									key={letter}
									x={CENTER + r * Math.sin(angle)}
									y={CENTER - r * Math.cos(angle) + 5}
									fontSize={14}
									textAnchor="middle"
									fill={letter === "N" ? colors.accentDefault : colors.textTertiary}
								>
									{letter}
								</SvgText>
							);
						})}
						<G rotation={bearing} origin={`${CENTER}, ${CENTER}`}>
							<Path
								d={`M${CENTER} ${CENTER} L${CENTER - 26} ${CENTER - 128} A132 132 0 0 1 ${CENTER + 26} ${CENTER - 128} Z`}
								fill={colors.statusCaution}
								opacity={0.18}
							/>
							<Line
								x1={CENTER}
								y1={CENTER - 40}
								x2={CENTER}
								y2={CENTER - 118}
								stroke={colors.statusCaution}
								strokeWidth={3}
								strokeLinecap="round"
							/>
							<Circle cx={CENTER} cy={CENTER - 120} r={5} fill={colors.statusCaution} />
							<SvgText
								x={CENTER}
								y={CENTER - 134}
								fontSize={11}
								textAnchor="middle"
								fill={colors.statusCaution}
							>
								MAKKAH
							</SvgText>
						</G>
					</Svg>
				</Animated.View>
				<View
					style={[
						styles.kaabaRing,
						{
							borderColor: colors.borderDefault,
							backgroundColor: aligned ? colors.statusSuccessSubtle : colors.statusCautionSubtle,
						},
					]}
				>
					<Svg width={64} height={68} viewBox="0 0 64 68">
						<Polygon
							points="32,2 62,16 32,30 2,16"
							fill={kaabaFace}
							stroke={colors.borderStrong}
							strokeWidth={1}
						/>
						<Polygon
							points="2,16 32,30 32,66 2,52"
							fill={kaabaFace}
							stroke={colors.borderStrong}
							strokeWidth={1}
						/>
						<Polygon
							points="62,16 32,30 32,66 62,52"
							fill={kaabaFace}
							stroke={colors.borderStrong}
							strokeWidth={1}
						/>
						<Polygon points="2,22 32,36 32,41 2,27" fill={colors.statusCaution} />
						<Polygon points="62,22 32,36 32,41 62,27" fill={colors.statusCaution} />
						<Polygon points="44,44 52,40 52,52 44,56" fill={colors.statusCaution} />
					</Svg>
				</View>
			</View>

			{heading ? (
				<View style={styles.meter}>
					<View style={[styles.track, { backgroundColor: colors.bgSubtle }]}>
						<View style={[styles.mid, { backgroundColor: colors.textSecondary }]} />
						<View
							style={[
								styles.knob,
								{
									backgroundColor: aligned ? colors.statusSuccess : colors.accentDefault,
									left: `${50 + offset * 50}%`,
								},
							]}
						/>
					</View>
					<PoText variant="mono13" tone="textSecondary" style={styles.centerText}>
						{aligned
							? "Lined up · hold it here"
							: `${Math.round(Math.abs(turn ?? 0))}° off · turn ${(turn ?? 0) > 0 ? "right" : "left"}`}
					</PoText>
				</View>
			) : (
				<PoText variant="text14" tone="textSecondary" style={styles.centerText}>
					{unavailable
						? `The compass isn't answering. Face ${Math.round(bearing)}° from north (${compassPoint(bearing)}), or tap Calibrate.`
						: "Hold your phone flat, away from metal and magnets."}
				</PoText>
			)}

			<View style={styles.chips}>
				<MetaChip
					icon="Line/Check"
					iconTone={
						accuracy >= 3 ? "statusSuccess" : accuracy === 2 ? "statusCaution" : "statusDanger"
					}
					label={`Accuracy ${accuracy >= 3 ? "high" : accuracy === 2 ? "medium" : "low"}`}
				/>
				<MetaChip
					icon="Settings"
					label="Calibrate"
					onPress={() =>
						Alert.alert(
							"Calibrate the compass",
							"Move your phone in a slow figure 8 a few times, away from metal, magnets and other devices.",
						)
					}
				/>
			</View>
		</FaithScreen>
	);
}

const styles = StyleSheet.create({
	headline: { alignItems: "center", gap: 4 },
	compass: {
		alignSelf: "center",
		width: SIZE,
		height: SIZE + 16,
		alignItems: "center",
		justifyContent: "flex-end",
	},
	pointer: { position: "absolute", top: 0, zIndex: 1 },
	dial: { width: SIZE, height: SIZE },
	kaabaRing: {
		position: "absolute",
		bottom: CENTER - 58,
		width: 116,
		height: 116,
		borderRadius: 58,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	meter: { gap: 10, paddingHorizontal: 12 },
	track: { height: 6, borderRadius: 3, justifyContent: "center" },
	mid: { position: "absolute", left: "50%", width: 2, height: 20, marginLeft: -1 },
	knob: { position: "absolute", width: 14, height: 14, borderRadius: 7, marginLeft: -7 },
	centerText: { textAlign: "center" },
	chips: { flexDirection: "row", justifyContent: "center", gap: 8 },
});
