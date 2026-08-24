import { render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { useAuth } from "@/modules/auth";
import ModulesLayout from "./_layout";

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

describe("ModulesLayout auth guard", () => {
	it("renders nothing while auth bootstrap is unresolved", () => {
		mockedUseAuth.mockReturnValue({
			token: null,
			loading: true,
		} as ReturnType<typeof useAuth>);

		const { queryByText } = render(<ModulesLayout />);

		expect(queryByText("stack")).toBeNull();
		expect(queryByText(/^redirect:/)).toBeNull();
	});

	it("redirects unauthenticated users to login", () => {
		mockedUseAuth.mockReturnValue({
			token: null,
			loading: false,
		} as ReturnType<typeof useAuth>);

		const { queryByText, getByText } = render(<ModulesLayout />);

		expect(getByText("redirect:/(auth)/login")).toBeTruthy();
		expect(queryByText("stack")).toBeNull();
	});

	it("renders module screens for an authenticated session", () => {
		mockedUseAuth.mockReturnValue({
			token: "access-token",
			loading: false,
		} as ReturnType<typeof useAuth>);

		const { queryByText, getByText } = render(<ModulesLayout />);

		expect(getByText("stack")).toBeTruthy();
		expect(queryByText(/^redirect:/)).toBeNull();
	});

	it("routes to auth when a signed-in session is torn down (sign-out or expired refresh)", () => {
		mockedUseAuth.mockReturnValue({
			token: "access-token",
			loading: false,
		} as ReturnType<typeof useAuth>);

		const { queryByText, getByText, rerender } = render(<ModulesLayout />);
		expect(queryByText(/^redirect:/)).toBeNull();

		// clearSession() drops the token on sign-out or failed mid-session
		// refresh; the layout must react by routing to auth.
		mockedUseAuth.mockReturnValue({
			token: null,
			loading: false,
		} as ReturnType<typeof useAuth>);
		rerender(<ModulesLayout />);

		expect(getByText("redirect:/(auth)/login")).toBeTruthy();
		expect(queryByText("stack")).toBeNull();
	});

	it("returns to module screens after sign-in establishes a session", () => {
		mockedUseAuth.mockReturnValue({
			token: null,
			loading: false,
		} as ReturnType<typeof useAuth>);

		const { queryByText, getByText, rerender } = render(<ModulesLayout />);
		expect(getByText("redirect:/(auth)/login")).toBeTruthy();

		mockedUseAuth.mockReturnValue({
			token: "access-token",
			loading: false,
		} as ReturnType<typeof useAuth>);
		rerender(<ModulesLayout />);

		expect(getByText("stack")).toBeTruthy();
		expect(queryByText(/^redirect:/)).toBeNull();
	});
});
