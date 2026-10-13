import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@starter/ui/lib/utils";

function Spinner({
	className,
	strokeWidth = 2,
	...props
}: React.ComponentProps<"svg"> & { strokeWidth?: number }) {
	return (
		<HugeiconsIcon
			icon={Loading03Icon}
			strokeWidth={strokeWidth}
			data-slot="spinner"
			role="status"
			aria-label="Loading"
			className={cn("size-4 animate-spin", className)}
			{...props}
		/>
	);
}

export { Spinner };
