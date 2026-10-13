"use client";

import { cn } from "@starter/ui/lib/utils";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
import React, { type HTMLAttributes, type ReactNode, useId, useMemo } from "react";
import { generateAaveLensNormalMap } from "./bottom-bar";

import type { HTMLMotionProps } from "motion/react";

export type GlassCardProps = Omit<HTMLMotionProps<"div">, "children" | "className"> & {
	themeMode?: "dark" | "light" | "auto";
	depth?: number;
	curvature?: number;
	splay?: number;
	chroma?: number;
	blur?: number;
	glow?: number;
	edgeHighlight?: number;
	specularAngle?: number;
	interactive?: boolean;
	children?: ReactNode;
	className?: string;
};

export function GlassCard({
	themeMode = "dark",
	depth = 48,
	curvature = 75,
	splay = 1.0,
	chroma = 0.85,
	blur = 2.5,
	glow = 1.0,
	edgeHighlight: _edgeHighlight = 0.35,
	specularAngle = 145,
	interactive = true,
	children,
	className,
	...props
}: GlassCardProps) {
	const rawId = useId();
	const reduce = useReducedMotion();
	const filterId = useMemo(() => `aave-card-filter-${rawId.replace(/:/g, "")}`, [rawId]);

	const isLight = themeMode === "light";

	const normalMapDataUrl = useMemo(
		() =>
			generateAaveLensNormalMap({
				width: 320,
				height: 220,
				borderRadius: 24,
				depth,
				curvature,
				splay,
				glow,
			}),
		[depth, curvature, splay, glow],
	);

	const baseScale = 28;
	const scaleR = baseScale * (1 + chroma * 0.08);
	const scaleG = baseScale * (1 + chroma * 0.04);
	const scaleB = baseScale;

	return (
		<MotionConfig
			transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 20 }}
		>
			<div className="relative group">
				{/* SVG DISPLACEMENT MAP FILTER PIPELINE */}
				<svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
					<defs>
						<filter
							id={filterId}
							filterUnits="objectBoundingBox"
							primitiveUnits="objectBoundingBox"
							colorInterpolationFilters="sRGB"
							x="-20%"
							y="-20%"
							width="140%"
							height="140%"
						>
							<feFlood floodColor="rgb(128,128,128)" floodOpacity="1" result="mapBg" />
							{normalMapDataUrl ? (
								<feImage href={normalMapDataUrl} preserveAspectRatio="none" result="rawMap" />
							) : null}
							<feComposite in="rawMap" in2="mapBg" operator="over" result="map" />
							<feColorMatrix
								in="map"
								type="matrix"
								values="1 0 0 0 0  0 0.5555555555555556 0 0 0.2222222222222222  0 0 1 0 0  0 0 0 1 0"
								result="scaledMap"
							/>
							<feDisplacementMap
								in="SourceGraphic"
								in2="scaledMap"
								scale={scaleR}
								xChannelSelector="R"
								yChannelSelector="G"
							/>
							<feColorMatrix
								type="matrix"
								values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
								result="dispR"
							/>
							<feDisplacementMap
								in="SourceGraphic"
								in2="scaledMap"
								scale={scaleG}
								xChannelSelector="R"
								yChannelSelector="G"
							/>
							<feColorMatrix
								type="matrix"
								values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
								result="dispG"
							/>
							<feDisplacementMap
								in="SourceGraphic"
								in2="scaledMap"
								scale={scaleB}
								xChannelSelector="R"
								yChannelSelector="G"
							/>
							<feColorMatrix
								type="matrix"
								values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
								result="dispB"
							/>
							<feComposite
								in="dispR"
								in2="dispG"
								operator="arithmetic"
								k1="0"
								k2="1"
								k3="1"
								k4="0"
							/>
							<feComposite
								in2="dispB"
								operator="arithmetic"
								k1="0"
								k2="1"
								k3="1"
								k4="0"
								result="lensResult"
							/>
							<feColorMatrix
								in="map"
								type="matrix"
								values="0 0 -1 0 1.5  0 0 -1 0 1.5  0 0 -1 0 1.5  0 0 0 0 1"
								result="specMask"
							/>
							<feComposite
								in="specMask"
								in2="lensResult"
								operator="arithmetic"
								k1="1"
								k2="0"
								k3="0"
								k4="0"
								result="lensResult"
							/>
							<feFlood floodColor="black" floodOpacity="1" result="lensMask" />
							<feComposite in="SourceGraphic" in2="lensMask" operator="out" result="holedSG" />
							<feComposite in="lensResult" in2="holedSG" operator="over" />
						</filter>
					</defs>
				</svg>

				{/* GLASS CARD CONTAINER */}
				<motion.div
					whileHover={interactive && !reduce ? { scale: 1.02, y: -4 } : undefined}
					whileTap={interactive && !reduce ? { scale: 0.98 } : undefined}
					className={cn(
						"relative rounded-3xl p-6 overflow-hidden border transition-all duration-300 select-none",
						isLight
							? "border-black/15 bg-white/70 text-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.08)] ring-1 ring-black/5"
							: "border-white/15 bg-[#0c0c0e]/80 text-zinc-100 shadow-[0_24px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10",
						className,
					)}
					style={{
						backdropFilter: `blur(${blur * 6}px) saturate(180%)`,
						WebkitBackdropFilter: `blur(${blur * 6}px) saturate(180%)`,
						boxShadow: isLight
							? `inset 0 1.5px 2px rgba(255,255,255,0.9), inset 0 -1px 1px rgba(0,0,0,0.1), 0 12px 40px rgba(0,0,0,0.1)`
							: `inset 0 1.5px 2px rgba(255,255,255,0.4), inset 0 -1.5px 2px rgba(0,0,0,0.7), 0 20px 50px rgba(0,0,0,0.75)`,
					}}
					{...props}
				>
					{/* SPECULAR LIGHTING GRADIENT OVERLAY */}
					<div
						className="absolute inset-0 pointer-events-none opacity-80"
						style={{
							background: `linear-gradient(${specularAngle}deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.05) 40%, transparent 100%)`,
						}}
					/>

					{/* AMBIENT GLOW EDGE */}
					<div
						className={cn(
							"absolute inset-0 pointer-events-none rounded-3xl transition-opacity duration-300 opacity-0 group-hover:opacity-100",
							isLight
								? "bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-purple-500/10"
								: "bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-purple-500/20",
						)}
					/>

					<div className="relative z-10 space-y-4">{children}</div>
				</motion.div>
			</div>
		</MotionConfig>
	);
}

export function GlassCardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("space-y-1.5", className)} {...props} />;
}

export function GlassCardTitle({
	className,
	children,
	...props
}: HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h3 className={cn("text-xl font-bold tracking-tight text-foreground", className)} {...props}>
			{children}
		</h3>
	);
}

export function GlassCardDescription({
	className,
	...props
}: HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p className={cn("text-sm text-muted-foreground leading-relaxed", className)} {...props} />
	);
}

export function GlassCardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("pt-2", className)} {...props} />;
}

export function GlassCardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("flex items-center justify-between pt-4 border-t border-border/50", className)}
			{...props}
		/>
	);
}

export function GlassCardBadge({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border border-teal-500/30 bg-teal-500/10 text-teal-400 backdrop-blur-md",
				className,
			)}
			{...props}
		>
			{children}
		</span>
	);
}
