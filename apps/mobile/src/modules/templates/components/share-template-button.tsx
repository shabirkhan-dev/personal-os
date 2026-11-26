import { useState } from "react";
import { showDialog } from "@/components/ui/dialog";
import { PillButton } from "@/components/ui/pill-button";
import { haptics } from "@/lib/haptics";

/** "Share as a template": sends the person's own thing as a file through the share sheet. */
export function ShareTemplateButton({
	label = "Share as a template",
	share,
}: {
	label?: string;
	share: () => Promise<void>;
}) {
	const [busy, setBusy] = useState(false);
	return (
		<PillButton
			label={busy ? "Preparing…" : label}
			variant="secondary"
			disabled={busy}
			onPress={() => {
				setBusy(true);
				share()
					.then(() => haptics.success())
					.catch((error: unknown) => {
						console.error("[templates] could not share", error);
						showDialog("Couldn't share", "Sharing isn't available right now. Try again.");
					})
					.finally(() => setBusy(false));
			}}
		/>
	);
}
