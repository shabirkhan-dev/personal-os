"use client";

import { cn } from "@starter/ui/lib/utils";
import { LayoutGroup, MotionConfig, motion, type Transition, useReducedMotion } from "motion/react";
import React, {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useId,
	useMemo,
	useState,
} from "react";

export type AaveGlassConfig = {
	themeMode?: "dark" | "light" | "auto";
	width?: number;
	height?: number;
	borderRadius?: number;
	scale?: number;
	depth?: number;
	curvature?: number;
	splay?: number;
	chroma?: number;
	blur?: number;
	glow?: number;
	edgeHighlight?: number;
	specularAngle?: number;
	switchScaleY?: number;
	switchScaleX?: number;
	stiffness?: number;
	damping?: number;
	mass?: number;
};

type BottomBarContextType = {
	value: string;
	setValue: (v: string) => void;
	groupId: string;
	filterId: string;
	config: Required<AaveGlassConfig>;
};

const BottomBarContext = createContext<BottomBarContextType | null>(null);

function useBottomBar() {
	const ctx = useContext(BottomBarContext);
	if (!ctx) throw new Error("BottomBar.* components must be used inside <BottomBar>");
	return ctx;
}

/**
 * Generates official Aave Glass RGB Normal Displacement Map Data URL
 */
export function generateAaveLensNormalMap({
	width = 120,
	height = 60,
	borderRadius: _borderRadius = 30,
	depth = 52,
	curvature = 80,
	splay = 1.0,
	glow = 1.0,
}: {
	width?: number;
	height?: number;
	borderRadius?: number;
	depth?: number;
	curvature?: number;
	splay?: number;
	glow?: number;
}): string {
	if (typeof document === "undefined") return "";

	const canvas = document.createElement("canvas");
	const w = Math.max(32, Math.round(width));
	const h = Math.max(32, Math.round(height));
	canvas.width = w;
	canvas.height = h;

	const ctx = canvas.getContext("2d");
	if (!ctx) return "";

	const imgData = ctx.createImageData(w, h);
	const data = imgData.data;

	const cx = w / 2;
	const cy = h / 2;
	const curv = Math.max(0.2, curvature / 40);
	const dep = depth / 50;

	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const idx = (y * w + x) * 4;

			const dx = (x - cx) / cx;
			const dy = (y - cy) / cy;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist <= 1) {
				const factor = Math.pow(dist, curv) * dep;
				const normX = Math.min(1, Math.max(-1, dx * factor * splay));
				const normY = Math.min(1, Math.max(-1, dy * factor * splay));

				data[idx] = Math.round(128 + normX * 127);
				data[idx + 1] = Math.round(128 + normY * 127);
				data[idx + 2] = Math.round(255 * (1 - dist * 0.4) * Math.min(1.5, glow));
				data[idx + 3] = 255;
			} else {
				data[idx] = 128;
				data[idx + 1] = 128;
				data[idx + 2] = 128;
				data[idx + 3] = 0;
			}
		}
	}

	ctx.putImageData(imgData, 0, 0);
	return canvas.toDataURL();
}

export function BottomBar({
	defaultValue,
	value,
	onValueChange,
	themeMode = "dark",
	width = 120,
	height = 44,
	borderRadius = 24,
	scale = 0.2,
	depth = 52,
	curvature = 80,
	splay = 1.0,
	chroma = 0.98,
	blur = 2.0,
	glow = 1.0,
	edgeHighlight = 0.25,
	specularAngle = 180,
	switchScaleY = 1.35,
	switchScaleX = 1.25,
	stiffness = 240,
	damping = 18,
	mass = 0.8,
	children,
	className,
}: AaveGlassConfig & {
	defaultValue?: string;
	value?: string;
	onValueChange?: (v: string) => void;
	children: ReactNode;
	className?: string;
}) {
	const [internal, setInternal] = useState(defaultValue ?? "home");
	const rawId = useId();
	const [filterCounter, setFilterCounter] = useState(0);
	const reduce = useReducedMotion();

	const controlled = value !== undefined;
	const current = controlled ? value || "home" : internal || "home";

	const setValue = useCallback(
		(v: string) => {
			if (v === current) return;
			if (!controlled) setInternal(v);
			setFilterCounter((prev) => prev + 1);
			onValueChange?.(v);
		},
		[controlled, current, onValueChange],
	);

	const config: Required<AaveGlassConfig> = useMemo(
		() => ({
			themeMode,
			width,
			height,
			borderRadius,
			scale,
			depth,
			curvature,
			splay,
			chroma,
			blur,
			glow,
			edgeHighlight,
			specularAngle,
			switchScaleY,
			switchScaleX,
			stiffness,
			damping,
			mass,
		}),
		[
			themeMode,
			width,
			height,
			borderRadius,
			scale,
			depth,
			curvature,
			splay,
			chroma,
			blur,
			glow,
			edgeHighlight,
			specularAngle,
			switchScaleY,
			switchScaleX,
			stiffness,
			damping,
			mass,
		],
	);

	const springTransition: Transition = useMemo(
		() => ({
			type: "spring",
			stiffness: config.stiffness,
			damping: config.damping,
			mass: config.mass,
		}),
		[config.stiffness, config.damping, config.mass],
	);

	const groupId = useMemo(() => `glass-group-${rawId.replace(/:/g, "")}`, [rawId]);
	const filterId = useMemo(
		() => `aave-refract-map-${rawId.replace(/:/g, "")}-${filterCounter}`,
		[rawId, filterCounter],
	);

	const isLight = themeMode === "light";

	const normalMapDataUrl = useMemo(
		() =>
			generateAaveLensNormalMap({
				width,
				height,
				borderRadius,
				depth,
				curvature,
				splay,
				glow,
			}),
		[width, height, borderRadius, depth, curvature, splay, glow],
	);

	const baseScale = config.scale * 160;
	const scaleR = baseScale * (1 + config.chroma * 0.08);
	const scaleG = baseScale * (1 + config.chroma * 0.04);
	const scaleB = baseScale;

	const contextValue = useMemo(
		() => ({ value: current, setValue, groupId, filterId, config }),
		[current, setValue, groupId, filterId, config],
	);

	return (
		<MotionConfig transition={reduce ? { duration: 0 } : springTransition}>
			<BottomBarContext.Provider value={contextValue}>
				<LayoutGroup id={groupId}>
					{/* SVG PIPELINE */}
					<svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
						<defs>
							<filter
								id={filterId}
								filterUnits="objectBoundingBox"
								primitiveUnits="objectBoundingBox"
								colorInterpolationFilters="sRGB"
								x="-30%"
								y="-30%"
								width="160%"
								height="160%"
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

					<motion.nav
						layout
						layoutRoot
						aria-label="Aave Glass Dock Navigation"
						className={cn(
							"inline-flex items-center gap-1.5 p-1.5 px-2 rounded-full border select-none relative transition-all duration-300",
							isLight
								? "border-black/15 bg-white/80 text-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur-2xl"
								: "border-white/[0.16] bg-[#0c0c0e]/85 text-zinc-200 shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_24px_rgba(168,85,247,0.15)] ring-1 ring-white/[0.08] backdrop-blur-2xl",
							className,
						)}
					>
						{children}
					</motion.nav>
				</LayoutGroup>
			</BottomBarContext.Provider>
		</MotionConfig>
	);
}

export function BottomBarItem({
	value,
	icon,
	children,
	className,
}: {
	value: string;
	icon?: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	const { value: current, setValue, config } = useBottomBar();
	const active = current === value;
	const isLight = config.themeMode === "light";

	return (
		<motion.button
			layout
			type="button"
			role="tab"
			aria-selected={active}
			onClick={() => setValue(value)}
			className={cn(
				"relative z-10 flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-200 outline-none select-none min-h-[44px]",
				active
					? isLight
						? "text-zinc-950 font-bold"
						: "text-white font-semibold"
					: isLight
						? "text-zinc-700 hover:text-zinc-950 hover:bg-black/[0.05]"
						: "text-zinc-300 hover:text-white hover:bg-white/[0.05]",
				className,
			)}
		>
			<span className="relative z-10 flex items-center gap-2.5 pointer-events-none">
				{icon ? (
					<span
						className={cn(
							"transition-colors duration-200",
							active
								? isLight
									? "text-indigo-600 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
									: "text-indigo-300 drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]"
								: isLight
									? "text-zinc-500"
									: "text-zinc-400",
						)}
					>
						{icon}
					</span>
				) : null}
				<span
					className={cn(
						"transition-colors duration-200",
						active
							? isLight
								? "text-zinc-950 font-bold"
								: "text-white font-semibold"
							: isLight
								? "text-zinc-700"
								: "text-zinc-300",
					)}
				>
					{children}
				</span>
			</span>

			{/* ACTIVE SELECTION INDICATOR LENS WITH SHARED LAYOUT ANIMATION */}
			{active ? (
				<motion.div
					layoutId="active-glass-indicator"
					layout
					className={cn(
						"absolute inset-0 rounded-full overflow-hidden z-0 border pointer-events-none",
					)}
					style={{
						borderColor: isLight
							? `rgba(0, 0, 0, ${config.edgeHighlight})`
							: `rgba(255, 255, 255, ${config.edgeHighlight})`,
						backgroundColor: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.08)",
						backdropFilter: `blur(${config.blur * 8}px) saturate(180%)`,
						WebkitBackdropFilter: `blur(${config.blur * 8}px) saturate(180%)`,
						boxShadow: isLight
							? `inset 0 1.5px 2px rgba(255,255,255,0.9), inset 0 -1px 1px rgba(0,0,0,0.1), 0 6px 20px rgba(0,0,0,0.12)`
							: `inset 0 1.5px 2px rgba(255,255,255,0.6), inset 0 -1.5px 2px rgba(0,0,0,0.6), 0 8px 25px rgba(0,0,0,0.6)`,
					}}
					transition={{
						type: "spring",
						stiffness: config.stiffness,
						damping: config.damping,
						mass: config.mass,
					}}
					animate={{
						scaleX: [1, config.switchScaleX, 0.9, 1.04, 1],
						scaleY: [1, config.switchScaleY, 1.15, 0.95, 1],
					}}
				>
					<div
						className={cn("absolute inset-0 rounded-full pointer-events-none opacity-90")}
						style={{
							background: `linear-gradient(${config.specularAngle}deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.08) 45%, transparent 100%)`,
						}}
					/>
				</motion.div>
			) : null}
		</motion.button>
	);
}
