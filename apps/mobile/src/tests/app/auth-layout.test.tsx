import { render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { useAuth } from "@/modules/auth";
import AuthLayout from "../../app/(auth)/_layout";

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

	it("bounces an authenticated deep link to modules once bootstrap resolves", () => {
		// Cold start deep-linked into (auth) with a stored session: the auth
		// form renders while bootstrap is pending, then must hand off.
		mockedUseAuth.mockReturnValue({
			token: null,
			loading: true,
		} as ReturnType<typeof useAuth>);

		const { queryByText, getByText, rerender } = render(<AuthLayout />);
		expect(getByText("stack")).toBeTruthy();
		expect(queryByText(/^redirect:/)).toBeNull();

		mockedUseAuth.mockReturnValue({
			token: "restored-access-token",
			loading: false,
		} as ReturnType<typeof useAuth>);
		rerender(<AuthLayout />);

		expect(getByText("redirect:/(modules)/(dashboard)")).toBeTruthy();
		expect(queryByText("stack")).toBeNull();
	});

	it("returns to auth screens after sign-out clears an authenticated session", () => {
		mockedUseAuth.mockReturnValue({
			token: "access-token",
			loading: false,
		} as ReturnType<typeof useAuth>);

		const { queryByText, getByText, rerender } = render(<AuthLayout />);
		expect(queryByText("stack")).toBeNull();

		mockedUseAuth.mockReturnValue({
			token: null,
			loading: false,
		} as ReturnType<typeof useAuth>);
		rerender(<AuthLayout />);

		expect(getByText("stack")).toBeTruthy();
		expect(queryByText(/^redirect:/)).toBeNull();
	});
});
