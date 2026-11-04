import { elevation } from "@personal-os/tokens";
import { useEffect, useId } from "react";
import { BackHandler, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { create } from "zustand";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { haptics } from "@/lib/haptics";
import { toShadowStyle, usePoTheme } from "@/theme";

/** The same shape as React Native's `AlertButton`, so call sites read like `Alert.alert`. */
export type DialogButton = {
	text: string;
	style?: "default" | "cancel" | "destructive";
	onPress?: () => void;
};

type Dialog = { title: string; message?: string; buttons: readonly DialogButton[] };

type DialogState = {
	dialog: Dialog | null;
	/** Layers that can draw the dialog (the app root, then each open sheet); the last one does. */
	hosts: readonly string[];
};

const useDialogStore = create<DialogState>(() => ({ dialog: null, hosts: [] }));

/**
 * A Kit v2 confirm or notice in place of the system alert, which ignores the theme and does
 * nothing on web. Without buttons it shows a single "OK".
 */
export function showDialog(title: string, message?: string, buttons?: readonly DialogButton[]) {
	useDialogStore.setState({
		dialog: { title, message, buttons: buttons?.length ? buttons : [{ text: "OK" }] },
	});
}

function close(button?: DialogButton) {
	useDialogStore.setState({ dialog: null });
	button?.onPress?.();
}

/**
 * Draws the dialog over its layer. Mount one at the app root and one inside each modal sheet: a
 * dialog has to sit inside the top-most modal to be seen above it.
 */
export function DialogHost() {
	const id = useId();
	const dialog = useDialogStore((state) => state.dialog);
	const active = useDialogStore((state) => state.hosts[state.hosts.length - 1] === id);

	useEffect(() => {
		useDialogStore.setState((state) => ({ hosts: [...state.hosts, id] }));
		return () =>
			useDialogStore.setState((state) => ({ hosts: state.hosts.filter((h) => h !== id) }));
	}, [id]);

	const visible = active && dialog !== null;
	useEffect(() => {
		if (!visible) return;
		haptics.select();
		// Android Back cancels, as it does for the system alert.
		const sub = BackHandler.addEventListener("hardwareBackPress", () => {
			const current = useDialogStore.getState().dialog;
			close(current?.buttons.find((button) => button.style === "cancel"));
			return true;
		});
		return () => sub.remove();
	}, [visible]);

	if (!visible) return null;
	return <DialogCard dialog={dialog} />;
}

function DialogCard({ dialog }: { dialog: Dialog }) {
	const { colors } = usePoTheme();
	const cancel = dialog.buttons.find((button) => button.style === "cancel");
	// The main choice sits on top as the filled pill; cancel is always the quiet one at the bottom.
	const actions = dialog.buttons.filter((button) => button !== cancel);

	return (
		<Animated.View
			entering={FadeIn.duration(160)}
			exiting={FadeOut.duration(120)}
			style={styles.overlay}
		>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={cancel ? cancel.text : "Close"}
				onPress={() => close(cancel)}
				style={[StyleSheet.absoluteFill, { backgroundColor: colors.bgCanvas, opacity: 0.72 }]}
			/>
			<View
				accessibilityViewIsModal
				accessibilityRole="alert"
				style={[
					styles.card,
					{ backgroundColor: colors.bgSurface },
					toShadowStyle(elevation.floating),
				]}
			>
				<View style={styles.text}>
					<PoText variant="title18" accessibilityRole="header">
						{dialog.title}
					</PoText>
					{dialog.message ? (
						<PoText variant="text14" tone="textSecondary">
							{dialog.message}
						</PoText>
					) : null}
				</View>
				<View style={styles.buttons}>
					{actions.map((button, index) => (
						<PillButton
							key={button.text}
							label={button.text}
							variant={
								button.style === "destructive" ? "danger" : index === 0 ? "primary" : "secondary"
							}
							onPress={() => close(button)}
						/>
					))}
					{cancel ? (
						<PillButton variant="ghost" label={cancel.text} onPress={() => close(cancel)} />
					) : null}
				</View>
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	overlay: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
		zIndex: 1000,
	},
	card: {
		width: "100%",
		maxWidth: 360,
		gap: 20,
		padding: 16,
		borderRadius: 20,
	},
	text: { gap: 8 },
	buttons: { gap: 8 },
});
