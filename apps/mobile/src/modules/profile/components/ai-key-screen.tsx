import { AiError, checkProvider } from "@personal-os/ai";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { FilterChip } from "@/components/module-ui";
import { ModuleScreen } from "@/components/module-screen";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { TextField } from "@/components/ui/text-field";
import { AUTO_FREE_MODEL, type FreeModel, loadFreeModels } from "@/lib/ai/free-models";
import {
	maskKey,
	OWN_AI_PROVIDERS,
	type OwnAi,
	type OwnAiProvider,
	ownAiConfig,
	useOwnAi,
} from "@/lib/ai/own-ai";
import { aiLimitMessage } from "@/lib/api/ai-limits";
import { haptics } from "@/lib/haptics";
import { usePoTheme } from "@/theme";
import { SectionLabel } from "./settings-list";

const PROVIDERS = Object.keys(OWN_AI_PROVIDERS) as OwnAiProvider[];

/** Why a key couldn't be checked, in plain words. */
function checkMessage(error: unknown): string {
	if (error instanceof AiError) return aiLimitMessage(error) ?? "That didn't work. Try again.";
	return "That didn't work. Check the address and the connection, then try again.";
}

/** Checks a key with one tiny request to its provider. */
async function check(candidate: OwnAi): Promise<void> {
	const config = ownAiConfig(candidate);
	if (config.provider !== "openai_compatible") return;
	await checkProvider(config);
}

/**
 * Settings · Your AI key: bring a key from OpenRouter, OpenAI or any OpenAI-compatible provider.
 * It stays in this phone's keystore and AI tasks call the provider straight from the phone, so
 * nothing about it reaches the Personal OS server.
 */
export function AiKeyScreen() {
	const { colors } = usePoTheme();
	const { own, hydrated, hydrate, save, clear } = useOwnAi();
	const [editing, setEditing] = useState(false);
	const [provider, setProvider] = useState<OwnAiProvider>("openrouter");
	const [baseUrl, setBaseUrl] = useState("");
	const [apiKey, setApiKey] = useState("");
	const [model, setModel] = useState<string>(AUTO_FREE_MODEL);
	const [free, setFree] = useState<FreeModel[] | null>(null);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<{ text: string; good: boolean } | null>(null);

	useEffect(() => {
		hydrate().catch((error: unknown) => console.warn("[ai] hydrate failed", error));
	}, [hydrate]);

	const showForm = editing || (hydrated && own === null);

	useEffect(() => {
		if (!showForm || provider !== "openrouter" || free !== null) return;
		loadFreeModels()
			.then(setFree)
			.catch((error: unknown) => {
				console.warn("[ai] could not list free models", error);
				setFree([]);
			});
	}, [showForm, provider, free]);

	const startEditing = () => {
		setProvider(own?.provider ?? "openrouter");
		setBaseUrl(own?.provider === "custom" ? own.baseUrl : "");
		setModel(own?.model ?? AUTO_FREE_MODEL);
		setApiKey("");
		setNotice(null);
		setEditing(true);
	};

	const draft = (): OwnAi | null => {
		const url = provider === "custom" ? baseUrl.trim() : OWN_AI_PROVIDERS[provider].baseUrl;
		const key = apiKey.trim() || (own?.provider === provider ? own.apiKey : "");
		if (!url.startsWith("https://")) return null;
		if (!key || !model.trim()) return null;
		return { provider, baseUrl: url, model: model.trim(), apiKey: key };
	};

	const saveKey = async () => {
		const candidate = draft();
		if (!candidate) {
			setNotice({
				text:
					provider === "custom"
						? "Add the provider's https address, your key and a model."
						: "Add your key and pick a model.",
				good: false,
			});
			return;
		}
		setBusy(true);
		setNotice({ text: "Checking your key with the provider…", good: true });
		try {
			await check(candidate);
			await save(candidate);
			haptics.success();
			setEditing(false);
			setApiKey("");
			setNotice({ text: "Saved. AI on this phone now uses your key.", good: true });
		} catch (error) {
			console.warn("[ai] key check failed", error);
			setNotice({ text: checkMessage(error), good: false });
		} finally {
			setBusy(false);
		}
	};

	const testSaved = async () => {
		if (!own) return;
		setBusy(true);
		setNotice(null);
		try {
			await check(own);
			haptics.success();
			setNotice({ text: "Your key works.", good: true });
		} catch (error) {
			setNotice({ text: checkMessage(error), good: false });
		} finally {
			setBusy(false);
		}
	};

	const remove = () => {
		clear()
			.then(() => {
				setNotice({ text: "Removed from this phone.", good: true });
				setEditing(false);
			})
			.catch((error: unknown) => {
				console.error("[ai] could not remove the key", error);
				setNotice({ text: "Couldn't remove it. Try again.", good: false });
			});
	};

	const info = OWN_AI_PROVIDERS[provider];

	return (
		<ModuleScreen label="Your AI key" tab="profile" onHome={() => router.dismissTo("/")}>
			<View style={styles.title}>
				<PoText variant="eyebrow11" tone="textTertiary">
					ON THIS PHONE ONLY
				</PoText>
				<PoText variant="title30">Use your own AI</PoText>
				<PoText variant="body15" tone="textSecondary">
					Bring a key from OpenRouter (free models included), OpenAI or any compatible provider.
					It's kept in this phone's secure keystore, never synced, never in backups, and AI calls go
					straight from this phone to your provider.
				</PoText>
			</View>

			{own && !editing ? (
				<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
					<PoText variant="eyebrow11" tone="textTertiary">
						IN USE
					</PoText>
					<PoText variant="title18">{OWN_AI_PROVIDERS[own.provider].label}</PoText>
					<PoText variant="meta13" tone="textSecondary">
						{`${own.model} · key ${maskKey(own.apiKey)}`}
					</PoText>
					<View style={styles.row}>
						<PillButton
							label={busy ? "Checking…" : "Test it"}
							variant="secondary"
							disabled={busy}
							style={styles.flex}
							onPress={testSaved}
						/>
						<PillButton label="Change" style={styles.flex} onPress={startEditing} />
					</View>
					<Pressable accessibilityRole="button" onPress={remove} style={styles.link}>
						<PoText variant="row15" tone="textDanger">
							Remove my key
						</PoText>
					</Pressable>
				</View>
			) : null}

			{showForm ? (
				<>
					<SectionLabel>Provider</SectionLabel>
					<View style={styles.chips}>
						{PROVIDERS.map((item) => (
							<FilterChip
								key={item}
								label={OWN_AI_PROVIDERS[item].label}
								selected={provider === item}
								onPress={() => {
									setProvider(item);
									setModel(item === "openrouter" ? AUTO_FREE_MODEL : "");
									setNotice(null);
								}}
							/>
						))}
					</View>
					<PoText variant="meta13" tone="textSecondary" style={styles.pad}>
						{info.note}
					</PoText>

					<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
						{provider === "custom" ? (
							<TextField
								label="Address"
								value={baseUrl}
								onChangeText={setBaseUrl}
								placeholder="https://api.groq.com/openai/v1"
								keyboardType="url"
								plain
							/>
						) : null}
						<TextField
							label="API key"
							value={apiKey}
							onChangeText={setApiKey}
							placeholder={
								own?.provider === provider ? `Keep ${maskKey(own.apiKey)}` : "Paste your key"
							}
							secure
						/>
						{info.keyUrl ? (
							<Pressable
								accessibilityRole="link"
								onPress={() => {
									if (info.keyUrl) {
										Linking.openURL(info.keyUrl).catch((error: unknown) =>
											console.warn("[ai] could not open the key page", error),
										);
									}
								}}
							>
								<PoText variant="meta13" tone="textLink">
									{`Get a key from ${info.label}`}
								</PoText>
							</Pressable>
						) : null}
						<TextField
							label="Model"
							value={model}
							onChangeText={setModel}
							placeholder={provider === "openai" ? "gpt-4.1-mini" : "provider/model-name"}
							plain
						/>
					</View>

					{provider === "openrouter" ? (
						<>
							<SectionLabel>Free models</SectionLabel>
							{free === null ? (
								<PoText variant="meta13" tone="textTertiary" style={styles.pad}>
									Looking up OpenRouter's free models…
								</PoText>
							) : free.length === 0 ? (
								<PoText variant="meta13" tone="textTertiary" style={styles.pad}>
									Couldn't load the list. Type a model name, like one ending in ":free".
								</PoText>
							) : (
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									style={styles.chipsBleed}
									contentContainerStyle={styles.chipRow}
								>
									{free.map((item) => (
										<FilterChip
											key={item.id}
											label={item.name}
											selected={model === item.id}
											onPress={() => setModel(item.id)}
										/>
									))}
								</ScrollView>
							)}
							<PoText variant="meta13" tone="textTertiary" style={styles.pad}>
								Free models have daily limits and can take up to a minute to answer. Any paid model
								works too.
							</PoText>
						</>
					) : null}

					<View style={styles.row}>
						{own ? (
							<PillButton
								label="Cancel"
								variant="secondary"
								style={styles.flex}
								onPress={() => {
									setEditing(false);
									setNotice(null);
								}}
							/>
						) : null}
						<PillButton
							label={busy ? "Checking…" : "Check and save"}
							disabled={busy}
							style={styles.flex}
							onPress={saveKey}
						/>
					</View>
				</>
			) : null}

			{notice ? (
				<PoText
					variant="meta13"
					tone={notice.good ? "textSecondary" : "textWarning"}
					style={styles.pad}
				>
					{notice.text}
				</PoText>
			) : null}

			<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
				<PoText variant="row15">What uses it</PoText>
				<PoText variant="meta13" tone="textSecondary">
					Designing a budget, a day, a Care routine or a training program, planning meals, reading a
					meal or a job post, each module's Ask, and the chat assistant with its tools, memory and
					past chats. All of it runs on this phone with your key: no account, no Personal OS server.
				</PoText>
			</View>
		</ModuleScreen>
	);
}

const styles = StyleSheet.create({
	title: { gap: 8, paddingHorizontal: 4 },
	card: { gap: 12, padding: 16, borderRadius: 22 },
	row: { flexDirection: "row", gap: 10 },
	flex: { flex: 1, minWidth: 0 },
	link: { alignSelf: "flex-start", paddingVertical: 4 },
	pad: { paddingHorizontal: 8 },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	chipsBleed: { marginHorizontal: -16, flexGrow: 0 },
	chipRow: { gap: 8, paddingHorizontal: 16 },
});
