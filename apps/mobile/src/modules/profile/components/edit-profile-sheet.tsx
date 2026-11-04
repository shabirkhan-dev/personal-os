import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { useAuth } from "@/modules/auth";
import { Avatar } from "@/modules/onboarding/components/avatar";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { usersService } from "@/modules/users/services/users.service";
import { usePoTheme } from "@/theme";
import { pickAvatar, removeLocalAvatar, uploadPendingAvatar } from "../services/avatar";
import { useAvatarStore } from "../store/avatar-store";

type EditProfileSheetProps = { visible: boolean; onClose: () => void };

const LATER: Record<"offline" | "storage-off" | "failed", string> = {
	offline: "Saved on this phone. It uploads when you're online.",
	"storage-off": "Saved on this phone. Uploads start once photo storage is set up on the server.",
	failed: "Saved on this phone. The upload will be tried again.",
};

/** Edit profile: your photo and name. Saved on the phone at once, then to the account. */
export function EditProfileSheet({ visible, onClose }: EditProfileSheetProps) {
	const { colors } = usePoTheme();
	const auth = useAuth();
	const savedName = useOnboardingStore((state) => state.name);
	const photo = useAvatarStore((state) => state.data.uri);
	const pending = useAvatarStore((state) => state.data.pending);
	const [name, setName] = useState(savedName);
	const [uploading, setUploading] = useState(false);
	const [photoNote, setPhotoNote] = useState<string | null>(null);
	const [saveNote, setSaveNote] = useState<string | null>(null);

	useEffect(() => {
		if (!visible) return;
		setName(savedName);
		setPhotoNote(null);
		setSaveNote(null);
	}, [visible, savedName]);

	const upload = async () => {
		if (auth.status !== "signed-in" || !auth.token) {
			setPhotoNote("Saved on this phone. Sign in to keep it on your account.");
			return;
		}
		setUploading(true);
		const outcome = await uploadPendingAvatar(auth.token);
		setUploading(false);
		if (outcome?.status === "uploaded") {
			auth.updateUser(outcome.user);
			setPhotoNote("Photo saved to your account.");
			haptics.success();
		} else if (outcome) setPhotoNote(LATER[outcome.reason]);
	};

	const choose = async (source: "camera" | "library") => {
		setPhotoNote(null);
		const result = await pickAvatar(source);
		if (result === "ok") await upload();
		else if (result === "denied") {
			setPhotoNote(
				`Allow ${source === "camera" ? "the camera" : "photos"} for Personal OS in Settings.`,
			);
		} else if (result === "error") setPhotoNote("Couldn't use that photo. Try another.");
	};

	const remove = async () => {
		removeLocalAvatar();
		setPhotoNote("Photo removed.");
		if (auth.status === "signed-in" && auth.token && auth.user?.avatarUrl) {
			try {
				auth.updateUser(await usersService.updateProfile(auth.token, { avatarKey: null }));
			} catch (error) {
				console.warn("[profile] could not remove the photo from the account", error);
				setPhotoNote("Removed here. It will be removed from your account next time you're online.");
			}
		}
	};

	const save = async () => {
		const trimmed = name.trim();
		if (!trimmed) return;
		useOnboardingStore.getState().set("name", trimmed);
		useOnboardingProgress
			.getState()
			.persistAnswers()
			.catch((error: unknown) => console.error("Could not save the profile", error));
		haptics.success();
		if (auth.status === "signed-in" && auth.token && auth.user?.displayName !== trimmed) {
			try {
				auth.updateUser(await usersService.updateProfile(auth.token, { displayName: trimmed }));
			} catch (error) {
				console.warn("[profile] could not save the name to the account", error);
				setSaveNote("Saved on this phone. Your account updates when you're online.");
				return;
			}
		}
		onClose();
	};

	const hasPhoto = Boolean(photo ?? auth.user?.avatarUrl);

	return (
		<Sheet
			visible={visible}
			title="Edit profile"
			onClose={onClose}
			action={{ label: "Save", onPress: () => void save(), disabled: name.trim().length === 0 }}
		>
			<View style={styles.photo}>
				<View>
					<Avatar name={name || savedName} size={96} />
					{uploading ? (
						<View style={[styles.busy, { backgroundColor: colors.bgCanvas }]}>
							<ActivityIndicator color={colors.accentDefault} />
						</View>
					) : null}
				</View>
				<View style={styles.photoActions}>
					<PhotoButton
						icon="Line/Plus"
						label={hasPhoto ? "Change" : "Choose photo"}
						onPress={() => void choose("library")}
					/>
					<PhotoButton
						icon="Filled/Camera"
						label="Take photo"
						onPress={() => void choose("camera")}
					/>
					{hasPhoto ? (
						<PhotoButton icon="Line/Close" label="Remove" onPress={() => void remove()} />
					) : null}
				</View>
			</View>
			{uploading ? (
				<PoText variant="meta13" tone="textSecondary">
					Uploading your photo…
				</PoText>
			) : photoNote ? (
				<PoText variant="meta13" tone="textSecondary">
					{photoNote}
				</PoText>
			) : pending ? (
				<Pressable accessibilityRole="button" onPress={() => void upload()}>
					<PoText variant="meta13" tone="accentDefault">
						Photo is only on this phone · tap to upload
					</PoText>
				</Pressable>
			) : null}

			<TextField
				label="Name"
				value={name}
				onChangeText={setName}
				placeholder="Your name"
				onSubmitEditing={() => void save()}
			/>
			{auth.user?.email ? (
				<View style={[styles.email, { backgroundColor: colors.bgSubtle }]}>
					<PoText variant="meta13" tone="textSecondary">
						Signed in as
					</PoText>
					<PoText variant="row15" numberOfLines={1}>
						{auth.user.email}
					</PoText>
				</View>
			) : null}
			{saveNote ? (
				<PoText variant="meta13" tone="textSecondary">
					{saveNote}
				</PoText>
			) : null}
		</Sheet>
	);
}

function PhotoButton({
	icon,
	label,
	onPress,
}: {
	icon: "Line/Plus" | "Filled/Camera" | "Line/Close";
	label: string;
	onPress: () => void;
}) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			onPress={() => {
				haptics.tap();
				onPress();
			}}
			style={({ pressed }) => [
				styles.photoButton,
				{ backgroundColor: pressed ? colors.bgHover : colors.bgSubtle },
			]}
		>
			<Icon name={icon} size={14} color={colors.textPrimary} />
			<PoText variant="meta13">{label}</PoText>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	email: { gap: 4, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
	photo: { alignItems: "center", gap: 12 },
	photoActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
	photoButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		height: 36,
		paddingHorizontal: 12,
		borderRadius: 18,
	},
	busy: {
		position: "absolute",
		inset: 0,
		borderRadius: 48,
		opacity: 0.7,
		alignItems: "center",
		justifyContent: "center",
	},
});
