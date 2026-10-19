import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { EmptyCard, Footer, ScreenTitle } from "@/components/module-ui";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { parseAmount } from "@/lib/money";
import { usePoTheme } from "@/theme";
import { deleteOwned, logService, newOwned, saveOwned } from "../data/wishlist-actions";
import { useWishlistToday } from "../hooks/use-wishlist";
import { ageLabel, compactMoney, nextService, serviceState } from "../lib/wishlist-math";
import { OWNED_KINDS, type Owned, type OwnedKind } from "../lib/wishlist-model";
import { pickDreamPhoto } from "../services/dream-photo";
import { DreamImage } from "./dream-image";
import { WishlistScreen } from "./wishlist-screen";

const KIND_LABELS: Record<OwnedKind, string> = { vehicle: "Vehicle", tech: "Tech", other: "Other" };

/** Garage: what you own, kept running. Vehicles show service by km or date; tech shows its age. */
export function GarageScreen() {
	const { colors } = usePoTheme();
	const { data, now } = useWishlistToday();
	const { owned, loading } = data;
	const [adding, setAdding] = useState(false);
	const [editing, setEditing] = useState<Owned | null>(null);
	const [servicing, setServicing] = useState<Owned | null>(null);
	const vehicles = owned.filter((item) => item.kind === "vehicle");
	const others = owned.filter((item) => item.kind !== "vehicle");
	const firstVehicle = vehicles[0] ?? null;

	return (
		<WishlistScreen>
			<ScreenTitle eyebrow="What you own · keep it running" title="Garage" />
			{loading ? (
				<ActivityIndicator color={colors.accentDefault} />
			) : owned.length === 0 ? (
				<EmptyCard
					icon="Settings"
					title="Nothing here yet"
					body="Add your bike, car, laptop or phone. Vehicles get service reminders by km or date; dreams you buy land here too."
				>
					<PillButton label="Add a thing" onPress={() => setAdding(true)} />
				</EmptyCard>
			) : null}

			{vehicles.map((vehicle) => (
				<VehicleCard
					key={vehicle.id}
					vehicle={vehicle}
					now={now}
					onEdit={() => setEditing(vehicle)}
					onService={() => setServicing(vehicle)}
				/>
			))}

			{others.length > 0 ? (
				<View style={[styles.card, { backgroundColor: colors.bgSurface }]}>
					<View style={styles.head}>
						<PoText variant="title18" style={styles.flex}>
							Tech and more
						</PoText>
						<PoText variant="mono13" tone="textTertiary">
							{`${others.length} ${others.length === 1 ? "thing" : "things"}`}
						</PoText>
					</View>
					{others.map((item) => {
						const age = ageLabel(item.boughtAt, now);
						const detail = [age, item.note].filter(Boolean).join(" · ");
						return (
							<Pressable
								key={item.id}
								accessibilityRole="button"
								accessibilityLabel={`${item.name}, ${detail}`}
								onPress={() => setEditing(item)}
								style={styles.row}
							>
								<DreamImage photo={item.photo} category="tech" width={52} height={52} />
								<View style={styles.flex}>
									<PoText variant="row15">{item.name}</PoText>
									<PoText variant="meta13" tone="textSecondary" numberOfLines={1}>
										{detail || KIND_LABELS[item.kind]}
									</PoText>
								</View>
								<Icon name="Line/Chevron right" size={16} color={colors.textTertiary} />
							</Pressable>
						);
					})}
				</View>
			) : null}

			{owned.length > 0 ? (
				<Footer>
					<PillButton
						variant="secondary"
						label="Add a thing"
						style={styles.flex}
						onPress={() => setAdding(true)}
					/>
					<PillButton
						label="Log service"
						style={styles.flex}
						disabled={!firstVehicle}
						onPress={() => setServicing(firstVehicle)}
					/>
				</Footer>
			) : null}

			<OwnedSheet
				visible={adding || editing !== null}
				owned={editing}
				onClose={() => {
					setAdding(false);
					setEditing(null);
				}}
			/>
			<ServiceSheet owned={servicing} now={now} onClose={() => setServicing(null)} />
		</WishlistScreen>
	);
}

function VehicleCard({
	vehicle,
	now,
	onEdit,
	onService,
}: {
	vehicle: Owned;
	now: Date;
	onEdit: () => void;
	onService: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<View style={[styles.card, styles.vehicle, { backgroundColor: colors.bgSurface }]}>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`Edit ${vehicle.name}`}
				onPress={onEdit}
			>
				<DreamImage photo={vehicle.photo} category="bikes" height={170} radius={18} />
			</Pressable>
			<View style={styles.head}>
				<PoText variant="title18" style={styles.flex}>
					{vehicle.name}
				</PoText>
				<PoText variant="mono13" tone="textTertiary">
					{vehicle.km !== null ? `${vehicle.km.toLocaleString("en-US")} km` : ""}
				</PoText>
			</View>
			{vehicle.service.map((item) => {
				const state = serviceState(item, vehicle, now);
				const width = `${Math.round(Math.min(1, Math.max(0.02, state.used)) * 100)}%` as const;
				return (
					<Pressable
						key={item.id}
						accessibilityRole="button"
						accessibilityLabel={`${item.label}, ${state.label}`}
						accessibilityHint="Logs it as done"
						onPress={onService}
						style={styles.service}
					>
						<View style={styles.head}>
							<PoText variant="meta13" tone="textSecondary" style={styles.flex}>
								{item.label}
							</PoText>
							<PoText
								variant="meta13"
								tone={
									state.tone === "statusDanger"
										? "textDanger"
										: state.tone === "statusCaution"
											? "textWarning"
											: "textTertiary"
								}
							>
								{state.label}
							</PoText>
						</View>
						<View style={[styles.meter, { backgroundColor: colors.bgSubtle }]}>
							<View style={[styles.meter, { width, backgroundColor: colors[state.tone] }]} />
						</View>
					</Pressable>
				);
			})}
			{vehicle.resale ? (
				<PoText variant="meta13" tone="textTertiary">
					{`Resale now about ${compactMoney(vehicle.resale)}.${vehicle.note ? ` ${vehicle.note}` : ""}`}
				</PoText>
			) : vehicle.note ? (
				<PoText variant="meta13" tone="textTertiary">
					{vehicle.note}
				</PoText>
			) : null}
		</View>
	);
}

/** Add or edit something owned: name, kind, odometer, resale value, a note and a photo. */
function OwnedSheet({
	visible,
	owned,
	onClose,
}: {
	visible: boolean;
	owned: Owned | null;
	onClose: () => void;
}) {
	const [name, setName] = useState("");
	const [kind, setKind] = useState<OwnedKind>("vehicle");
	const [km, setKm] = useState("");
	const [resale, setResale] = useState("");
	const [note, setNote] = useState("");
	const [photoUri, setPhotoUri] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [openedFor, setOpenedFor] = useState<string | null>(null);

	const key = visible ? (owned?.id ?? "new") : null;
	if (key !== openedFor) {
		setOpenedFor(key);
		setName(owned?.name ?? "");
		setKind(owned?.kind ?? "vehicle");
		setKm(owned?.km !== null && owned?.km !== undefined ? String(owned.km) : "");
		setResale(owned?.resale ? String(owned.resale) : "");
		setNote(owned?.note ?? "");
		setPhotoUri(owned?.photo?.kind === "file" ? owned.photo.uri : null);
		setError(null);
	}

	const kmValue = km.trim() ? Number(km.replace(/,/g, "")) : null;
	const kmOk = kmValue === null || (Number.isFinite(kmValue) && kmValue >= 0);
	const resaleValue = resale.trim() ? parseAmount(resale) : null;

	const save = async () => {
		try {
			const photo = photoUri ? { kind: "file" as const, uri: photoUri } : (owned?.photo ?? null);
			const base = owned ?? newOwned({ name, kind, photo, km: kmValue });
			await saveOwned({
				...base,
				name: name.trim().slice(0, 80),
				kind,
				photo,
				km: kind === "vehicle" ? (kmValue ?? base.km ?? 0) : null,
				resale: resaleValue,
				note: note.trim().slice(0, 200),
			});
			haptics.success();
			onClose();
		} catch (failure) {
			console.error("[wishlist] could not save", failure);
			setError("Couldn't save on this phone. Try again.");
		}
	};

	const remove = () => {
		if (!owned) return;
		Alert.alert(`Remove ${owned.name}?`, "It leaves your garage.", [
			{ text: "Keep", style: "cancel" },
			{
				text: "Remove",
				style: "destructive",
				onPress: () =>
					void deleteOwned(owned)
						.then(onClose)
						.catch((failure: unknown) => console.error("[wishlist] could not remove", failure)),
			},
		]);
	};

	return (
		<Sheet
			visible={visible}
			title={owned ? `Edit ${owned.name}` : "Add a thing"}
			onClose={onClose}
			action={{ label: "Save", onPress: () => void save(), disabled: !name.trim() || !kmOk }}
		>
			<TextField label="Name" value={name} onChangeText={setName} placeholder="450 street bike" />
			<ChoiceChips
				label="Kind"
				options={OWNED_KINDS.map((value) => ({ value, label: KIND_LABELS[value] }))}
				value={kind}
				onChange={setKind}
			/>
			{kind === "vehicle" ? (
				<TextField
					label="Odometer"
					value={km}
					onChangeText={setKm}
					keyboardType="number-pad"
					suffix="km"
					placeholder="12,400"
				/>
			) : null}
			<TextField
				label="Would sell for about (optional)"
				value={resale}
				onChangeText={setResale}
				keyboardType="decimal-pad"
				suffix="Rs"
			/>
			<TextField label="Note" value={note} onChangeText={setNote} placeholder="battery at 78%" />
			<PillButton
				variant="secondary"
				label={photoUri ? "Change photo" : "Add a photo"}
				onPress={() =>
					void pickDreamPhoto("library").then((result) => {
						if (result.status === "picked") setPhotoUri(result.uri);
						else if (result.status === "denied")
							setError("Allow photos for Personal OS in Settings.");
					})
				}
			/>
			{owned ? <PillButton variant="ghost" label="Remove from garage" onPress={remove} /> : null}
			{error ? (
				<PoText variant="meta13" tone="textDanger">
					{error}
				</PoText>
			) : null}
		</Sheet>
	);
}

/** "Log service": which item was done, at what odometer. */
function ServiceSheet({
	owned,
	now,
	onClose,
}: {
	owned: Owned | null;
	now: Date;
	onClose: () => void;
}) {
	const [itemId, setItemId] = useState<string | null>(null);
	const [km, setKm] = useState("");
	const [openedFor, setOpenedFor] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const key = owned?.id ?? null;
	if (key !== openedFor) {
		setOpenedFor(key);
		const next = owned ? nextService(owned, now) : null;
		setItemId(next?.item.id ?? owned?.service[0]?.id ?? null);
		setKm(owned?.km !== null && owned?.km !== undefined ? String(owned.km) : "");
		setError(null);
	}
	if (!owned) return null;
	const kmValue = km.trim() ? Number(km.replace(/,/g, "")) : null;
	const kmOk = kmValue === null || (Number.isFinite(kmValue) && kmValue >= (owned.km ?? 0));

	return (
		<Sheet
			visible
			title={`Log service · ${owned.name}`}
			onClose={onClose}
			action={{
				label: "Done today",
				disabled: !itemId || !kmOk,
				onPress: () => {
					if (!itemId) return;
					void logService(owned, itemId, kmValue)
						.then(() => {
							haptics.success();
							onClose();
						})
						.catch((failure: unknown) => {
							console.error("[wishlist] could not log service", failure);
							setError("Couldn't save on this phone. Try again.");
						});
				},
			}}
		>
			{owned.service.length === 0 ? (
				<PoText variant="body15" tone="textSecondary">
					No service items on this one yet.
				</PoText>
			) : (
				<ChoiceChips
					label="What was done"
					options={owned.service.map((item) => ({ value: item.id, label: item.label }))}
					value={itemId}
					onChange={setItemId}
				/>
			)}
			<TextField
				label="Odometer now"
				value={km}
				onChangeText={setKm}
				keyboardType="number-pad"
				suffix="km"
			/>
			{!kmOk ? (
				<PoText variant="meta13" tone="textDanger">
					{`The odometer can't go below ${owned.km?.toLocaleString("en-US") ?? 0} km.`}
				</PoText>
			) : null}
			{error ? (
				<PoText variant="meta13" tone="textDanger">
					{error}
				</PoText>
			) : null}
		</Sheet>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	card: { gap: 12, padding: 16, borderRadius: 28 },
	vehicle: { padding: 14 },
	head: { flexDirection: "row", alignItems: "center", gap: 8 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
	service: { gap: 6, paddingHorizontal: 4 },
	meter: { height: 6, borderRadius: 3 },
});
