import {
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	CreditCardIcon,
} from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { OSHeader } from "@/components/ui/os-header";
import { cn } from "@/lib/utils";
import { useAuth } from "@/modules/auth";
import { AccountTabs } from "@/modules/auth/components/account-tabs";
import { AuthAlert } from "@/modules/auth/components/auth-alert";
import {
	type BillingInterval,
	billingService,
	type PaymentProviderName,
	type PlanCode,
	type SubscriptionView,
} from "../billing.service";
import { billingRedirectUrls, openHostedCheckout, openHostedPortal } from "../open-hosted-checkout";

type PlanOption = {
	code: PlanCode;
	label: string;
	tagline: string;
	monthly: number;
	features: string[];
	recommended?: boolean;
};

const PLANS: PlanOption[] = [
	{
		code: "team",
		label: "Team",
		tagline: "For people building a more intentional daily system.",
		monthly: 49,
		recommended: true,
		features: ["Up to 5 workspaces", "Shared UI + Nest spine", "Email support", "Cancel anytime"],
	},
	{
		code: "enterprise",
		label: "Enterprise",
		tagline: "More seats, priority support, and onboarding help.",
		monthly: 399,
		features: [
			"Higher workspace limits",
			"Priority support",
			"Guided onboarding",
			"Invoice-friendly billing",
		],
	},
];

const PROVIDER_COPY: Record<PaymentProviderName, { label: string; hint: string }> = {
	stripe: { label: "Stripe", hint: "Cards worldwide · hosted checkout" },
	razorpay: { label: "Razorpay", hint: "Cards, UPI, netbanking (India)" },
};

function formatMoney(amount: number) {
	return `$${amount}`;
}

function yearlyMonthly(monthly: number) {
	return Math.round((monthly * 10) / 12);
}

export function BillingScreen() {
	const { user, token } = useAuth();
	const [providers, setProviders] = useState<PaymentProviderName[]>([]);
	const [provider, setProvider] = useState<PaymentProviderName>("stripe");
	const [planCode, setPlanCode] = useState<PlanCode>("team");
	const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
	const [subscription, setSubscription] = useState<SubscriptionView>(null);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [loading, setLoading] = useState(true);

	const loadBilling = useCallback(async () => {
		if (!token) return;
		setLoading(true);
		try {
			const [providerResult, subscriptionResult] = await Promise.all([
				billingService.listProviders(token),
				billingService.getSubscription(token),
			]);
			setProviders(providerResult.providers);
			if (providerResult.providers[0]) {
				setProvider(providerResult.providers[0]);
			}
			const next = subscriptionResult.subscription;
			setSubscription(next);
			if (next?.planCode === "team" || next?.planCode === "enterprise") {
				setPlanCode(next.planCode);
			}
			if (next?.billingInterval === "monthly" || next?.billingInterval === "yearly") {
				setBillingInterval(next.billingInterval);
			}
			if (next?.provider === "stripe" || next?.provider === "razorpay") {
				setProvider(next.provider);
			}
			setError(null);
		} catch (err) {
			setProviders([]);
			setError(err instanceof Error ? err.message : "Could not load billing");
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => {
		void loadBilling();
	}, [loadBilling]);

	if (!user) return null;

	const selectedPlan = PLANS.find((plan) => plan.code === planCode) ?? PLANS[0];
	const displayPrice =
		billingInterval === "yearly" ? yearlyMonthly(selectedPlan.monthly) : selectedPlan.monthly;
	const billedToday =
		billingInterval === "yearly" ? selectedPlan.monthly * 10 : selectedPlan.monthly;
	const canManageStripe = subscription?.provider === "stripe";
	const checkoutDisabled = busy || providers.length === 0 || !token;

	const startCheckout = async () => {
		if (!token) return;
		setBusy(true);
		setError(null);
		try {
			const redirects = billingRedirectUrls();
			const result = await billingService.createCheckout(token, {
				provider,
				planCode,
				billingInterval,
				successUrl: redirects.successUrl,
				cancelUrl: redirects.cancelUrl,
			});
			const outcome = await openHostedCheckout(result.checkoutUrl);
			if (outcome === "success") {
				await loadBilling();
				router.replace("/(modules)/(profile)/billing-success");
			} else if (outcome === "cancel") {
				router.replace("/(modules)/(profile)/billing-cancel");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Checkout failed");
		} finally {
			setBusy(false);
		}
	};

	const openPortal = async () => {
		if (!token) return;
		setBusy(true);
		setError(null);
		try {
			const redirects = billingRedirectUrls();
			const result = await billingService.createPortal(token, {
				provider: "stripe",
				returnUrl: redirects.returnUrl,
			});
			await openHostedPortal(result.url);
			await loadBilling();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Billing portal unavailable");
		} finally {
			setBusy(false);
		}
	};

	return (
		<View className="flex-1 bg-background">
			<SafeAreaView edges={["top"]} className="flex-1">
				<OSHeader />
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 40 }}
					keyboardShouldPersistTaps="handled"
				>
					<View className="px-4 pt-2">
						<View className="mb-4">
							<Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">
								ACCOUNT
							</Text>
							<Text className="text-foreground text-3xl font-light tracking-tight">Billing</Text>
							<Text className="text-muted-foreground text-sm mt-1">
								Upgrade when you need more workspace capacity or managed support. Personal OS stays
								free to use.
							</Text>
						</View>

						<AccountTabs active="billing" />

						{loading ? (
							<View className="h-48 items-center justify-center gap-3">
								<ActivityIndicator className="text-primary" />
								<Text className="text-muted-foreground text-xs font-medium">Loading billing…</Text>
							</View>
						) : (
							<>
								{error ? <AuthAlert message={error} variant="destructive" /> : null}

								<SubscriptionBanner
									subscription={subscription}
									onManage={openPortal}
									busy={busy}
									canManage={canManageStripe}
								/>

								{/* Plan Selection Card */}
								<View className="mb-5">
									<Card className="p-5">
										<View className="flex-row items-center justify-between mb-4">
											<View>
												<CardTitle className="text-base font-bold">Choose Plan</CardTitle>
												<CardDescription>Select workspace capacity.</CardDescription>
											</View>
											<IntervalToggle value={billingInterval} onChange={setBillingInterval} />
										</View>

										<View className="gap-3">
											{PLANS.map((plan) => {
												const selected = planCode === plan.code;
												const price =
													billingInterval === "yearly" ? yearlyMonthly(plan.monthly) : plan.monthly;
												return (
													<Pressable
														key={plan.code}
														onPress={() => setPlanCode(plan.code)}
														className={cn(
															"p-4 rounded-2xl border",
															selected
																? "bg-primary/10 border-primary"
																: "bg-muted/40 border-border",
														)}
													>
														<View className="flex-row items-center justify-between mb-1.5">
															<Text className="text-foreground font-bold text-base">
																{plan.label}
															</Text>
															{plan.recommended ? <Badge variant="default">Popular</Badge> : null}
														</View>
														<Text className="text-foreground font-bold text-2xl mb-1">
															{formatMoney(price)}
															<Text className="text-muted-foreground text-xs font-normal">/mo</Text>
														</Text>
														<Text className="text-muted-foreground text-xs mb-3">
															{plan.tagline}
														</Text>
														<View className="gap-1.5 pt-2 border-t border-border/40">
															{plan.features.map((feature) => (
																<View key={feature} className="flex-row items-center gap-2">
																	<Icon
																		icon={CheckmarkCircle02Icon}
																		size={14}
																		className="text-primary"
																		strokeWidth={2}
																	/>
																	<Text className="text-foreground text-xs font-medium">
																		{feature}
																	</Text>
																</View>
															))}
														</View>
													</Pressable>
												);
											})}
										</View>
									</Card>
								</View>

								{/* Payment Method Selector */}
								<View className="mb-5">
									<Card className="p-5">
										<CardTitle className="text-base font-bold mb-1">Payment Method</CardTitle>
										<CardDescription className="mb-4">
											{providers.length > 1
												? "Pick where payment is processed."
												: providers.length === 1
													? `Checkout opens in your browser via ${PROVIDER_COPY[provider]?.label ?? "Stripe"}.`
													: "Configure a payment provider on the API to enable checkout."}
										</CardDescription>

										{providers.length === 0 ? (
											<AuthAlert
												title="Checkout not configured"
												message="Add Stripe and/or Razorpay keys to the Nest API, then reopen this screen."
												variant="info"
											/>
										) : (
											<View className="flex-row gap-2.5">
												{providers.map((name) => {
													const selected = provider === name;
													const copy = PROVIDER_COPY[name];
													return (
														<Pressable
															key={name}
															onPress={() => setProvider(name)}
															className={cn(
																"flex-1 p-3.5 rounded-2xl border",
																selected
																	? "bg-primary/10 border-primary"
																	: "bg-muted/40 border-border",
															)}
														>
															<Text className="text-foreground font-bold text-sm mb-0.5">
																{copy?.label ?? name}
															</Text>
															<Text className="text-muted-foreground text-[10px] leading-tight">
																{copy?.hint ?? ""}
															</Text>
														</Pressable>
													);
												})}
											</View>
										)}
									</Card>
								</View>

								{/* Checkout CTA */}
								<Card className="p-5 mb-6">
									<View className="flex-row items-baseline justify-between mb-1">
										<Text className="text-foreground text-base font-bold">
											{selectedPlan.label} Plan
										</Text>
										<Text className="text-foreground text-xl font-bold">
											{formatMoney(displayPrice)}
											<Text className="text-muted-foreground text-xs font-normal">/mo</Text>
										</Text>
									</View>
									<Text className="text-muted-foreground text-xs mb-4">
										Billed as {formatMoney(billedToday)}{" "}
										{billingInterval === "yearly" ? "annually" : "today"}. Cancel anytime.
									</Text>
									<Button disabled={checkoutDisabled} loading={busy} onPress={startCheckout}>
										Proceed to checkout
									</Button>
								</Card>
							</>
						)}
					</View>
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}

function SubscriptionBanner({
	subscription,
	onManage,
	busy,
	canManage,
}: {
	subscription: SubscriptionView;
	onManage: () => void;
	busy: boolean;
	canManage: boolean;
}) {
	if (!subscription || subscription.status === "cancelled" || subscription.status === "ended") {
		return (
			<Card className="p-4 mb-5 border-border bg-muted/40">
				<View className="flex-row items-center gap-3">
					<Icon icon={CreditCardIcon} size={20} className="text-muted-foreground" />
					<View className="flex-1">
						<Text className="text-foreground text-sm font-bold">Free Plan Active</Text>
						<Text className="text-muted-foreground text-xs">
							Upgrade for more workspace limits and dedicated support.
						</Text>
					</View>
				</View>
			</Card>
		);
	}

	const isActive = subscription.status === "active" || subscription.status === "trialing";

	return (
		<Card
			className={cn(
				"p-4 mb-5 border",
				isActive ? "bg-primary/10 border-primary/40" : "bg-destructive/10 border-destructive/40",
			)}
		>
			<View className="flex-row items-center justify-between mb-2">
				<View className="flex-row items-center gap-2">
					<Icon
						icon={isActive ? CheckmarkCircle02Icon : CancelCircleIcon}
						size={18}
						className={isActive ? "text-primary" : "text-destructive"}
					/>
					<Text className="text-foreground font-bold text-sm capitalize">
						{subscription.planCode} ({subscription.status})
					</Text>
				</View>
				{canManage ? (
					<Pressable onPress={onManage} disabled={busy} className="px-2.5 py-1 rounded-lg bg-card">
						<Text className="text-foreground text-xs font-bold">Manage</Text>
					</Pressable>
				) : null}
			</View>
			<Text className="text-muted-foreground text-xs">
				Provider: {subscription.provider} · Interval: {subscription.billingInterval}
			</Text>
		</Card>
	);
}

function IntervalToggle({
	value,
	onChange,
}: {
	value: BillingInterval;
	onChange: (next: BillingInterval) => void;
}) {
	return (
		<View className="flex-row p-1 bg-muted/60 border border-border/40 rounded-xl">
			<Pressable
				onPress={() => onChange("monthly")}
				className={cn(
					"px-3 py-1.5 rounded-lg",
					value === "monthly" && "bg-card border border-border/60 shadow-sm",
				)}
			>
				<Text
					className={cn(
						"text-xs font-bold",
						value === "monthly" ? "text-foreground" : "text-muted-foreground",
					)}
				>
					Monthly
				</Text>
			</Pressable>
			<Pressable
				onPress={() => onChange("yearly")}
				className={cn(
					"px-3 py-1.5 rounded-lg",
					value === "yearly" && "bg-card border border-border/60 shadow-sm",
				)}
			>
				<Text
					className={cn(
						"text-xs font-bold",
						value === "yearly" ? "text-foreground" : "text-muted-foreground",
					)}
				>
					Yearly
				</Text>
			</Pressable>
		</View>
	);
}
