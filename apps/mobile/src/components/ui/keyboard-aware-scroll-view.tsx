import { type ReactNode, useCallback, useEffect, useRef, useState, type ComponentRef } from "react";
import {
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	ScrollView,
	type ScrollViewProps,
	type StyleProp,
	TextInput,
	View,
	type ViewStyle,
} from "react-native";
import { keyboardOverlap, useKeyboardTop } from "@/lib/use-keyboard";

/** Space kept between the focused field and the keyboard. */
const GAP = 24;
/** Lets layout settle (the room below, a sheet moving up) before measuring the field. */
const SETTLE_MS = 120;

type Measurable = {
	measureInWindow: (callback: (x: number, y: number, w: number, h: number) => void) => void;
};

export type KeyboardAwareScrollViewProps = ScrollViewProps & {
	children: ReactNode;
	/** The box around the scroll view; fills its parent by default. */
	frameStyle?: StyleProp<ViewStyle>;
	/**
	 * Adds room at the end for the part the keyboard covers. Off inside a sheet, which moves up
	 * by itself.
	 */
	addRoom?: boolean;
};

/**
 * A ScrollView that keeps the focused field above the keyboard. Android draws the app edge to
 * edge, so the window no longer shrinks for the keyboard: this measures how much the keyboard
 * actually covers, adds that much room at the end, and scrolls the field into view. It works the
 * same whether or not the system also resized the window.
 */
export function KeyboardAwareScrollView({
	children,
	onScroll,
	frameStyle,
	addRoom = true,
	...props
}: KeyboardAwareScrollViewProps) {
	const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
	const frame = useRef<ComponentRef<typeof View>>(null);
	const offset = useRef(0);
	const focused = useRef<unknown>(null);
	const keyboardTop = useKeyboardTop();
	const [room, setRoom] = useState(0);

	const reveal = useCallback(() => {
		const input = TextInput.State.currentlyFocusedInput() as Measurable | null;
		focused.current = input;
		if (!input || keyboardTop === null) return;
		input.measureInWindow((_x, y, _w, height) => {
			const overlap = keyboardOverlap(y + height + GAP, keyboardTop);
			if (overlap > 0) scroll.current?.scrollTo({ y: offset.current + overlap, animated: true });
		});
	}, [keyboardTop]);

	useEffect(() => {
		if (keyboardTop === null) {
			setRoom(0);
			return;
		}
		if (addRoom) {
			frame.current?.measureInWindow((_x, y, _w, height) =>
				setRoom(keyboardOverlap(y + height, keyboardTop)),
			);
		}
		const timer = setTimeout(reveal, SETTLE_MS);
		return () => clearTimeout(timer);
	}, [keyboardTop, reveal, addRoom]);

	// Moving to another field while the keyboard stays up.
	useEffect(() => {
		if (keyboardTop === null) return;
		const timer = setInterval(() => {
			if (TextInput.State.currentlyFocusedInput() !== focused.current) reveal();
		}, 250);
		return () => clearInterval(timer);
	}, [keyboardTop, reveal]);

	const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		offset.current = event.nativeEvent.contentOffset.y;
		onScroll?.(event);
	};

	return (
		<View ref={frame} style={frameStyle ?? FILL} collapsable={false}>
			<ScrollView
				ref={scroll}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="interactive"
				scrollEventThrottle={32}
				{...props}
				onScroll={handleScroll}
			>
				{children}
				{room > 0 ? <View style={{ height: room }} /> : null}
			</ScrollView>
		</View>
	);
}

const FILL: ViewStyle = { flex: 1 };
