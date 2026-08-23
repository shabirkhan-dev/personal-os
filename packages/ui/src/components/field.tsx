"use client";

import { Label } from "@personal-os/ui/components/label";
import { Separator } from "@personal-os/ui/components/separator";
import { cn } from "@personal-os/ui/lib/utils";
import type * as React from "react";

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div data-slot="field-group" className={cn("flex flex-col gap-4", className)} {...props} />
	);
}

function Field({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="field" className={cn("flex flex-col gap-2", className)} {...props} />;
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
	return <Label data-slot="field-label" className={cn("", className)} {...props} />;
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
	return (
		<p
			data-slot="field-description"
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		/>
	);
}

function FieldSeparator({
	className,
	children,
	...props
}: React.ComponentProps<"div"> & { children?: React.ReactNode }) {
	return (
		<div
			data-slot="field-separator"
			className={cn("relative flex items-center gap-2", className)}
			{...props}
		>
			<Separator className="flex-1" />
			{children != null && (
				<span
					data-slot="field-separator-content"
					className="text-muted-foreground bg-background px-2 text-xs"
				>
					{children}
				</span>
			)}
			<Separator className="flex-1" />
		</div>
	);
}

export { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator };
