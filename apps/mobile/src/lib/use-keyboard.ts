import { useEffect, useState } from "react";
import { Keyboard, type KeyboardEvent, Platform } from "react-native";

/** Where the keyboard's top edge is on screen, or null while it is hidden. */
export function useKeyboardTop(): number | null {
	const [top, setTop] = useState<number | null>(null);
	useEffect(() => {
		const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
		const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
		const show = Keyboard.addListener(showEvent, (event: KeyboardEvent) =>
			setTop(event.endCoordinates.screenY),
		);
		const hide = Keyboard.addListener(hideEvent, () => setTop(null));
		return () => {
			show.remove();
			hide.remove();
		};
	}, []);
	return top;
}

/** How far the area below `bottom` (a screen y) is covered by the keyboard. */
export function keyboardOverlap(bottom: number, keyboardTop: number | null): number {
	return keyboardTop === null ? 0 : Math.max(0, bottom - keyboardTop);
}

type Measurable = {
	measureInWindow: (
		callback: (x: number, y: number, width: number, height: number) => void,
	) => void;
};

/**
 * How much of a view the keyboard covers, measured each time it shows. Pad the view's bottom by
 * this much and its content stays visible, whether or not the system also resized the window.
 */
export function useKeyboardOverlap(ref: { current: Measurable | null }): number {
	const keyboardTop = useKeyboardTop();
	const [overlap, setOverlap] = useState(0);
	useEffect(() => {
		if (keyboardTop === null) {
			setOverlap(0);
			return;
		}
		ref.current?.measureInWindow((_x, y, _width, height) => {
			setOverlap(keyboardOverlap(y + height, keyboardTop));
		});
	}, [keyboardTop, ref]);
	return overlap;
}
