import { render, waitFor } from "@testing-library/react-native";
import * as SplashScreen from "expo-splash-screen";
import type { ReactNode } from "react";
import { useAuth } from "@/modules/auth";
import RootLayout from "../../app/_layout";

jest.mock("@/modules/auth", () => ({
	useAuth: jest.fn(),
}));

jest.mock("expo-splash-screen", () => ({
	preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
	hideAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/components/providers", () => {
	const { View } = require("react-native");
	return {
		AppProviders: ({ children }: { children?: ReactNode }) => <View>{children}</View>,
	};
});

jest.mock("expo-router", () => {
	const { Text, View } = require("react-native");
	const Stack = ({ children }: { children?: ReactNode }) => (
		<View>
			<Text>stack</Text>
			{children}
		</View>
	);
	Stack.Screen = () => null;
	return { Stack };
});

const mockedUseAuth = jest.mocked(useAuth);
const mockedHideAsync = jest.mocked(SplashScreen.hideAsync);

describe("RootLayout splash gating", () => {
	it("keeps the splash screen visible while auth bootstrap is unresolved", () => {
		mockedUseAuth.mockReturnValue({
			token: null,
			loading: true,
		} as ReturnType<typeof useAuth>);

		render(<RootLayout />);

		expect(mockedHideAsync).not.toHaveBeenCalled();
	});

	it("hides the splash screen only after auth bootstrap resolves", async () => {
		mockedUseAuth.mockReturnValue({
			token: "access-token",
			loading: false,
		} as ReturnType<typeof useAuth>);

		const { getByText } = render(<RootLayout />);

		await waitFor(() => expect(mockedHideAsync).toHaveBeenCalledTimes(1));
		expect(getByText("stack")).toBeTruthy();
	});
});
