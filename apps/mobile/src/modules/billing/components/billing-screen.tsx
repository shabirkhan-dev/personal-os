import {
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	CreditCardIcon,
} from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/icon";
import { NeonCard } from "@/components/ui/neon-card";
import { OSHeader } from "@/components/ui/os-header";
import { NeonColors } from "@/constants/design-system";
import { useAuth } from "@/modules/auth";
import { AccountTabs } from "@/modules/auth/components/account-tabs";
import { AuthAlert } from "@/modules/auth/components/auth-alert";
import { AuthButton } from "@/modules/auth/components/auth-button";
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
		tagline: "For small crews shipping the starter into production.",
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
	razorpay: { label: "Razorpay", hint: "India-friendly · UPI & cards" },
};

function yearlyMonthly(monthly: number): number {
	return Math.round((monthly * 10) / 12);
}

function formatMoney(amount: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(amount);
}

export function BillingScreen() {
	const { token, user } = useAuth();
	const [providers, setProviders] = useState<PaymentProviderName[]>([]);
	const [provider, setProvider] = useState<PaymentProviderName>("stripe");
	const [planCode, setPlanCode] = useState<PlanCode>("team");
	const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
	const [subscription, setSubscription] = useState<SubscriptionView>(null);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [ready, setReady] = useState(false);

	const loadBilling = useCallback(async () => {
		if (!token) return;
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
			setReady(true);
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
		<View style={styles.container}>
			<SafeAreaView edges={["top"]} style={styles.safeArea}>
				<OSHeader />
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.viewContainer}>
						<View style={styles.viewHeader}>
							<Text style={styles.eyebrow}>ACCOUNT</Text>
							<Text style={styles.viewTitle}>Billing</Text>
							<Text style={styles.viewSubtitle}>
								Upgrade when you need team seats or managed support. Starter stays free to clone and
								run.
							</Text>
						</View>

						<AccountTabs active="billing" />

						{!ready ? (
							<View style={styles.loadingBox}>
								<ActivityIndicator color={NeonColors.accent.green} />
								<Text style={styles.loadingText}>Loading billing…</Text>
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

								<NeonCard style={styles.sectionCard}>
									<View style={styles.sectionHeader}>
										<View style={styles.sectionHeaderText}>
											<Text style={styles.sectionTitle}>Plan</Text>
											<Text style={styles.sectionHint}>Select what you want after checkout.</Text>
										</View>
										<IntervalToggle value={billingInterval} onChange={setBillingInterval} />
									</View>

									<View style={styles.planGrid}>
										{PLANS.map((plan) => {
											const selected = planCode === plan.code;
											const price =
												billingInterval === "yearly" ? yearlyMonthly(plan.monthly) : plan.monthly;
											return (
												<Pressable
													key={plan.code}
													onPress={() => setPlanCode(plan.code)}
													style={[styles.planCard, selected && styles.planCardSelected]}
												>
													<View style={styles.planTop}>
														<Text style={styles.planLabel}>{plan.label}</Text>
														{plan.recommended ? (
															<View style={styles.recommendedBadge}>
																<Text style={styles.recommendedText}>Popular</Text>
															</View>
														) : null}
													</View>
													<Text style={styles.planPrice}>
														{formatMoney(price)}
														<Text style={styles.planPriceUnit}>/mo</Text>
													</Text>
													{billingInterval === "yearly" ? (
														<Text style={styles.planBilled}>
															Billed {formatMoney(plan.monthly * 10)}/yr · 2 months free
														</Text>
													) : (
														<Text style={styles.planBilled}>Billed monthly</Text>
													)}
													<Text style={styles.planTagline}>{plan.tagline}</Text>
													{plan.features.map((feature) => (
														<View key={feature} style={styles.featureRow}>
															<Icon
																icon={CheckmarkCircle02Icon}
																size={14}
																color={NeonColors.accent.green}
																strokeWidth={2}
															/>
															<Text style={styles.featureText}>{feature}</Text>
														</View>
													))}
												</Pressable>
											);
										})}
									</View>
								</NeonCard>

								<NeonCard style={styles.sectionCard}>
									<Text style={styles.sectionTitle}>Payment method</Text>
									<Text style={styles.sectionHint}>
										{providers.length > 1
											? "Same plan price — pick where payment is processed."
											: providers.length === 1
												? `Checkout opens in your browser via ${PROVIDER_COPY[provider].label}.`
												: "Configure a payment provider on the API to enable checkout."}
									</Text>
									{providers.length === 0 ? (
										<View style={styles.providerGap}>
											<AuthAlert
												title="Checkout not configured"
												message="Add Stripe and/or Razorpay keys to the Nest API, then reopen this screen."
												variant="info"
											/>
										</View>
									) : (
										<View style={styles.providerRow}>
											{providers.map((name) => {
												const selected = provider === name;
												const copy = PROVIDER_COPY[name];
												const selectable = providers.length > 1;
												return (
													<Pressable
														key={name}
														onPress={() => {
															if (selectable) setProvider(name);
														}}
														disabled={!selectable}
														style={[styles.providerCard, selected && styles.providerCardSelected]}
													>
														<Icon
															icon={CreditCardIcon}
															size={18}
															color={selected ? NeonColors.accent.green : NeonColors.text.secondary}
														/>
														<Text style={styles.providerLabel}>{copy.label}</Text>
														<Text style={styles.providerHint}>{copy.hint}</Text>
													</Pressable>
												);
											})}
										</View>
									)}
								</NeonCard>

								<NeonCard style={styles.sectionCard}>
									<Text style={styles.sectionTitle}>Checkout</Text>
									<Text style={styles.checkoutSummary}>
										{selectedPlan.label} · {formatMoney(displayPrice)}/mo
										{billingInterval === "yearly"
											? ` · ${formatMoney(billedToday)} billed today`
											: ""}
									</Text>
									<AuthButton
										label={
											busy ? "Opening checkout…" : `Continue with ${PROVIDER_COPY[provider].label}`
										}
										onPress={() => {
											void startCheckout();
										}}
										pending={busy}
										disabled={checkoutDisabled}
									/>
								</NeonCard>
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
	if (!subscription) {
		return (
			<NeonCard style={styles.sectionCard}>
				<Text style={styles.sectionTitle}>Current plan</Text>
				<Text style={styles.sectionHint}>Starter (free). Upgrade below when you need seats.</Text>
			</NeonCard>
		);
	}

	const periodEnd = subscription.currentPeriodEnd
		? new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			})
		: null;

	return (
		<NeonCard style={styles.sectionCard}>
			<Text style={styles.sectionTitle}>Current plan</Text>
			<Text style={styles.subStatus}>
				{subscription.planCode} · {subscription.status}
				{subscription.billingInterval ? ` · ${subscription.billingInterval}` : ""}
			</Text>
			{periodEnd ? (
				<Text style={styles.sectionHint}>
					{subscription.cancelAtPeriodEnd ? "Ends" : "Renews"} {periodEnd}
				</Text>
			) : null}
			{canManage ? (
				<AuthButton
					label="Manage in Stripe"
					variant="outline"
					onPress={onManage}
					pending={busy}
					style={styles.manageBtn}
				/>
			) : null}
		</NeonCard>
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
		<View style={styles.intervalRow}>
			{(["monthly", "yearly"] as const).map((interval) => {
				const active = value === interval;
				return (
					<Pressable
						key={interval}
						onPress={() => onChange(interval)}
						style={[styles.intervalChip, active && styles.intervalChipActive]}
					>
						<Text style={[styles.intervalLabel, active && styles.intervalLabelActive]}>
							{interval === "monthly" ? "Monthly" : "Yearly"}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

export function BillingResultScreen({ variant }: { variant: "success" | "cancel" }) {
	const success = variant === "success";
	return (
		<View style={styles.container}>
			<SafeAreaView edges={["top"]} style={styles.safeArea}>
				<OSHeader />
				<View style={styles.resultWrap}>
					<NeonCard style={styles.resultCard}>
						{success ? (
							<Icon
								icon={CheckmarkCircle02Icon}
								size={40}
								color={NeonColors.accent.green}
								strokeWidth={2}
							/>
						) : (
							<Icon
								icon={CancelCircleIcon}
								size={40}
								color={NeonColors.accent.orange}
								strokeWidth={2}
							/>
						)}
						<Text style={styles.eyebrow}>BILLING</Text>
						<Text style={styles.viewTitle}>
							{success ? "Payment received" : "Checkout cancelled"}
						</Text>
						<Text style={styles.viewSubtitle}>
							{success
								? "Your subscription activates once the provider webhook confirms it — usually within a few seconds."
								: "No charge was made. You can return to billing and try again whenever you are ready."}
						</Text>
						<AuthButton
							label="View billing"
							onPress={() => router.replace("/(modules)/(profile)/billing")}
							style={styles.manageBtn}
						/>
					</NeonCard>
				</View>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: NeonColors.background,
	},
	safeArea: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 48,
	},
	viewContainer: {
		paddingHorizontal: 20,
		gap: 16,
	},
	viewHeader: {
		gap: 6,
		paddingTop: 8,
	},
	eyebrow: {
		color: NeonColors.text.muted,
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1.2,
	},
	viewTitle: {
		color: NeonColors.text.primary,
		fontSize: 28,
		fontWeight: "700",
		letterSpacing: -0.5,
	},
	viewSubtitle: {
		color: NeonColors.text.secondary,
		fontSize: 14,
		lineHeight: 20,
		maxWidth: 360,
	},
	loadingBox: {
		alignItems: "center",
		gap: 12,
		paddingVertical: 48,
	},
	loadingText: {
		color: NeonColors.text.secondary,
		fontSize: 14,
	},
	sectionCard: {
		gap: 0,
	},
	sectionHeader: {
		gap: 12,
		marginBottom: 16,
	},
	sectionHeaderText: {
		gap: 4,
	},
	sectionTitle: {
		color: NeonColors.text.primary,
		fontSize: 16,
		fontWeight: "700",
	},
	sectionHint: {
		color: NeonColors.text.secondary,
		fontSize: 13,
		lineHeight: 18,
		marginTop: 4,
	},
	planGrid: {
		gap: 12,
	},
	planCard: {
		borderRadius: 16,
		borderWidth: 1,
		borderColor: NeonColors.card.border,
		backgroundColor: "rgba(255,255,255,0.03)",
		padding: 16,
		gap: 8,
	},
	planCardSelected: {
		borderColor: "rgba(0, 230, 118, 0.45)",
		backgroundColor: "rgba(0, 230, 118, 0.08)",
	},
	planTop: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 8,
	},
	planLabel: {
		color: NeonColors.text.primary,
		fontSize: 16,
		fontWeight: "700",
	},
	recommendedBadge: {
		borderRadius: 8,
		paddingHorizontal: 8,
		paddingVertical: 3,
		backgroundColor: "rgba(0, 230, 118, 0.15)",
	},
	recommendedText: {
		color: NeonColors.accent.green,
		fontSize: 11,
		fontWeight: "700",
	},
	planPrice: {
		color: NeonColors.text.primary,
		fontSize: 24,
		fontWeight: "700",
	},
	planPriceUnit: {
		fontSize: 14,
		fontWeight: "500",
		color: NeonColors.text.secondary,
	},
	planBilled: {
		color: NeonColors.text.muted,
		fontSize: 12,
	},
	planTagline: {
		color: NeonColors.text.secondary,
		fontSize: 13,
		lineHeight: 18,
		marginBottom: 4,
	},
	featureRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	featureText: {
		color: NeonColors.text.secondary,
		fontSize: 13,
		flex: 1,
	},
	providerRow: {
		gap: 10,
		marginTop: 14,
	},
	providerGap: {
		marginTop: 14,
	},
	providerCard: {
		borderRadius: 14,
		borderWidth: 1,
		borderColor: NeonColors.card.border,
		padding: 14,
		gap: 4,
	},
	providerCardSelected: {
		borderColor: "rgba(0, 230, 118, 0.45)",
		backgroundColor: "rgba(0, 230, 118, 0.08)",
	},
	providerLabel: {
		color: NeonColors.text.primary,
		fontSize: 15,
		fontWeight: "700",
		marginTop: 4,
	},
	providerHint: {
		color: NeonColors.text.secondary,
		fontSize: 12,
	},
	checkoutSummary: {
		color: NeonColors.text.secondary,
		fontSize: 13,
		marginTop: 8,
		marginBottom: 14,
	},
	subStatus: {
		color: NeonColors.text.primary,
		fontSize: 15,
		fontWeight: "600",
		marginTop: 6,
		textTransform: "capitalize",
	},
	manageBtn: {
		marginTop: 14,
	},
	intervalRow: {
		flexDirection: "row",
		gap: 6,
		alignSelf: "flex-start",
		padding: 3,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: NeonColors.card.border,
	},
	intervalChip: {
		paddingHorizontal: 12,
		paddingVertical: 7,
		borderRadius: 8,
	},
	intervalChipActive: {
		backgroundColor: "rgba(0, 230, 118, 0.15)",
	},
	intervalLabel: {
		color: NeonColors.text.secondary,
		fontSize: 12,
		fontWeight: "600",
	},
	intervalLabelActive: {
		color: NeonColors.accent.green,
	},
	resultWrap: {
		flex: 1,
		paddingHorizontal: 20,
		justifyContent: "center",
	},
	resultCard: {
		alignItems: "center",
		gap: 8,
	},
});
