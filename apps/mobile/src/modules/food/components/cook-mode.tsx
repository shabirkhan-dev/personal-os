import { useEffect, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeepAwake } from "expo-keep-awake";
import { Segments } from "@/components/module-ui";
import { HeaderButton } from "@/components/ui/header-button";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { useSpeaker } from "@/lib/voice";
import { usePoTheme } from "@/theme";
import type { Recipe } from "../lib/recipes";

const pad = (value: number) => String(value).padStart(2, "0");

function KeepAwake() {
	useKeepAwake();
	return null;
}

/** One step at a time in large type, read aloud, with the step's timer. The screen stays on. */
export function CookMode({ recipe, onClose }: { recipe: Recipe | null; onClose: () => void }) {
	const { colors } = usePoTheme();
	const insets = useSafeAreaInsets();
	const speaker = useSpeaker();
	const [index, setIndex] = useState(0);
	const [left, setLeft] = useState<number | null>(null);
	const step = recipe?.steps[index];
	const total = recipe?.steps.length ?? 0;

	useEffect(() => {
		setIndex(0);
		setLeft(null);
	}, [recipe]);

	useEffect(() => {
		if (!recipe || !step) return;
		setLeft(null);
		speaker.speak(`step-${index}`, [{ text: `Step ${index + 1}. ${step.text}` }]);
		// oxlint-disable-next-line react/exhaustive-deps -- reads each step once when it opens
	}, [recipe, index]);

	const running = left !== null && left > 0;
	useEffect(() => {
		if (!running) return;
		const timer = setInterval(() => {
			setLeft((value) => {
				if (value === null) return null;
				if (value <= 1) {
					haptics.success();
					speaker.speak("timer", [{ text: "Time's up." }]);
					return 0;
				}
				return value - 1;
			});
		}, 1000);
		return () => clearInterval(timer);
		// oxlint-disable-next-line react/exhaustive-deps -- the interval only depends on running
	}, [running]);

	const close = () => {
		speaker.stop();
		onClose();
	};

	return (
		<Modal visible={recipe !== null} animationType="slide" onRequestClose={close}>
			{recipe ? <KeepAwake /> : null}
			<View
				style={[
					styles.root,
					{
						backgroundColor: colors.bgApp,
						paddingTop: insets.top + 12,
						paddingBottom: insets.bottom + 20,
					},
				]}
			>
				<View style={styles.head}>
					<HeaderButton icon="Line/Close" accessibilityLabel="Close cook mode" onPress={close} />
					<View style={styles.flex}>
						<PoText variant="eyebrow11" tone="textTertiary">
							{`Cook mode · step ${index + 1} of ${total}`}
						</PoText>
						<PoText variant="row15" numberOfLines={1}>
							{recipe?.name ?? ""}
						</PoText>
					</View>
				</View>
				<Segments total={total} done={index} current={index} />
				<View style={styles.body}>
					<PoText variant="display36">{step?.text ?? ""}</PoText>
					{step?.minutes ? (
						<View style={styles.timer}>
							<PoText variant="hero40" tone={left === 0 ? "textSuccess" : "textPrimary"}>
								{left === null
									? `${step.minutes}:00`
									: `${Math.floor(left / 60)}:${pad(left % 60)}`}
							</PoText>
							<PillButton
								label={
									running ? "Pause" : left === 0 ? "Done" : left === null ? "Start timer" : "Resume"
								}
								variant="secondary"
								onPress={() => {
									haptics.tap();
									if (running) setLeft((value) => (value === null ? null : -value));
									else if (left === null) setLeft(step.minutes ? step.minutes * 60 : null);
									else if (left < 0) setLeft(-left);
								}}
							/>
						</View>
					) : null}
				</View>
				<View style={styles.footer}>
					<PillButton
						label="Back"
						variant="secondary"
						disabled={index === 0}
						style={styles.flex}
						onPress={() => setIndex((value) => Math.max(0, value - 1))}
					/>
					<PillButton
						label={index >= total - 1 ? "Finish" : "Next step"}
						style={styles.flex}
						onPress={() => {
							haptics.tap();
							if (index >= total - 1) close();
							else setIndex((value) => value + 1);
						}}
					/>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, gap: 18, paddingHorizontal: 16 },
	head: { flexDirection: "row", alignItems: "center", gap: 12 },
	flex: { flex: 1 },
	body: { flex: 1, justifyContent: "center", gap: 28 },
	timer: { alignItems: "flex-start", gap: 12 },
	footer: { flexDirection: "row", gap: 10 },
});
