"use client";

import { cn } from "@personal-os/ui/lib/utils";
import type * as React from "react";

// Primitive label; associate with input via htmlFor or wrap input inside.
function Label({ className, ...props }: React.ComponentProps<"label">) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: primitive; parent must set htmlFor or wrap control
		<label
			data-slot="label"
			className={cn(
				"gap-2 text-sm leading-none font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed",
				className,
			)}
			{...props}
		/>
	);
}

export { Label };
