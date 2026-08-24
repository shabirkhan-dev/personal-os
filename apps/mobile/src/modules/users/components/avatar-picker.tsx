import { ImageAdd01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { resolveMediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import { buildAvatarTemplates } from "../lib/avatar-templates";

interface AvatarPickerProps {
	seed: string;
	value: string | null | undefined;
	pending?: boolean;
	uploading?: boolean;
	onSelectTemplate: (url: string) => void;
	onPickFromDevice: () => void;
}

export function AvatarPicker({
	seed,
	value,
	pending = false,
	uploading = false,
	onSelectTemplate,
	onPickFromDevice,
}: AvatarPickerProps) {
	const templates = buildAvatarTemplates(seed);
	const busy = pending || uploading;
	const previewUri = resolveMediaUrl(value);
	const [failedUri, setFailedUri] = useState<string | null>(null);
	const previewFailed = previewUri != null && failedUri === previewUri;

	return (
		<View className="gap-3">
			<Text className="text-foreground text-sm font-semibold">Avatar</Text>
			<View className="flex-row items-center gap-3.5">
				<View className="w-18 h-18 rounded-full overflow-hidden border border-border bg-card items-center justify-center">
					{previewUri && !previewFailed ? (
						<Image
							key={previewUri}
							source={{ uri: previewUri }}
							className="w-full h-full"
							onError={() => setFailedUri(previewUri)}
						/>
					) : (
						<Text className="text-muted-foreground text-xs">None</Text>
					)}
				</View>
				<Pressable
					disabled={busy}
					onPress={onPickFromDevice}
					className={cn(
						"flex-row items-center gap-2 min-h-[44px] px-3.5 rounded-xl border border-border bg-muted/40",
						busy && "opacity-50",
					)}
				>
					{uploading ? (
						<ActivityIndicator className="text-primary" />
					) : (
						<>
							<Icon icon={ImageAdd01Icon} size={16} className="text-foreground" strokeWidth={1.8} />
							<Text className="text-foreground text-sm font-semibold">Upload photo</Text>
						</>
					)}
				</Pressable>
			</View>

			<Text className="text-muted-foreground text-xs mt-1">Or pick a template</Text>
			<View className="flex-row flex-wrap gap-2.5">
				{templates.map((template) => {
					const selected = value === template.url;
					return (
						<Pressable
							key={template.id}
							disabled={busy}
							onPress={() => onSelectTemplate(template.url)}
							className={cn(
								"w-16 h-16 rounded-2xl overflow-hidden border border-border relative",
								selected && "border-primary border-2",
								busy && "opacity-50",
							)}
						>
							<Image source={{ uri: template.url }} className="w-full h-full" />
							{selected ? (
								<View className="absolute right-1 bottom-1 w-4.5 h-4.5 rounded-full bg-primary items-center justify-center">
									<Icon
										icon={Tick01Icon}
										size={12}
										className="text-primary-foreground"
										strokeWidth={3}
									/>
								</View>
							) : null}
						</Pressable>
					);
				})}
			</View>
			<Text className="text-muted-foreground text-xs">JPEG, PNG, or WebP · max 2 MB</Text>
		</View>
	);
}

export function alertAvatarPermissionDenied() {
	Alert.alert(
		"Photo access needed",
		"Allow photo library access to upload an avatar from your device.",
	);
}
