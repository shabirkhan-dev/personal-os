import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/modules/auth";

export const unstable_settings = {
	initialRouteName: "login",
};

export default function AuthLayout() {
	const { token, loading } = useAuth();

	if (!loading && token) return <Redirect href="/(modules)/(dashboard)" />;

	return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}
