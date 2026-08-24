import { render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { useAuth } from "@/modules/auth";
import AuthLayout from "./_layout";

jest.mock("@/modules/auth", () => ({
	useAuth: jest.fn(),
}));

jest.mock("expo-router", () => {
	const { Text, View } = require("react-native");
	return {
		Redirect: ({ href }: { href: string }) => <Text>redirect:{href}</Text>,
		Stack: ({ children }: { children?: ReactNode }) => (
			<View>
				<Text>stack</Text>
				{children}
			</View>
		),
	};
});

const mockedUseAuth = jest.mocked(useAuth);

describe("AuthLayout authenticated redirect", () => {
	it("renders auth screens while auth bootstrap is unresolved", () => {
		mockedUseAuth.mockReturnValue({
			token: null,
			loading: true,
		} as ReturnType<typeof useAuth>);

		const { queryByText, getByText } = render(<AuthLayout />);

		expect(getByText("stack")).toBeTruthy();
		expect(queryByText(/^redirect:/)).toBeNull();
	});

	it("renders auth screens for unauthenticated users", () => {
		mockedUseAuth.mockReturnValue({
			token: null,
			loading: false,
		} as ReturnType<typeof useAuth>);

		const { queryByText, getByText } = render(<AuthLayout />);

		expect(getByText("stack")).toBeTruthy();
		expect(queryByText(/^redirect:/)).toBeNull();
	});

	it("redirects authenticated users away from auth routes", () => {
		mockedUseAuth.mockReturnValue({
			token: "access-token",
			loading: false,
		} as ReturnType<typeof useAuth>);

		const { queryByText, getByText } = render(<AuthLayout />);

		expect(getByText("redirect:/(modules)/(dashboard)")).toBeTruthy();
		expect(queryByText("stack")).toBeNull();
	});
});
