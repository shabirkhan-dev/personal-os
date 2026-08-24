import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/modules/auth";

export const unstable_settings = {
	initialRouteName: "(dashboard)",
};

export default function ModulesLayout() {
	const { token, loading } = useAuth();

	if (loading) return null;
	if (!token) return <Redirect href="/(auth)/login" />;

	return <Stack screenOptions={{ headerShown: false }} />;
}
