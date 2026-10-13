"use client";

import { ArrowDown01Icon, CheckIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { EASE_OUT } from "@starter/ui/lib/ease";
import { cn } from "@starter/ui/lib/utils";
import { motion, type Transition, useReducedMotion, type Variants } from "motion/react";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

const INSTANT_TRANSITION: Transition = { duration: 0 };

const CHEVRON_TRANSITION: Transition = {
	type: "spring",
	duration: 0.4,
	bounce: 0.3,
};

const LIST_VARIANTS: Variants = {
	hidden: {},
	show: { transition: { staggerChildren: 0.025, delayChildren: 0.04 } },
};

const ITEM_VARIANTS: Variants = {
	hidden: { opacity: 0, y: -6, filter: "blur(3px)" },
	show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

type Placement = "bottom" | "top";

interface SelectContextValue {
	value: string | undefined;
	open: boolean;
	setOpen: (open: boolean) => void;
	select: (value: string) => void;
	register: (value: string, label: string) => void;
	unregister: (value: string) => void;
	labelFor: (value: string | undefined) => string | undefined;
	reduce: boolean;
	triggerId: string;
	listId: string;
	disabled: boolean;
	error: boolean;
	dir: "ltr" | "rtl";
	placement: Placement;
	setPlacement: (p: Placement) => void;
	searchQuery: string;
	setSearchQuery: (q: string) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext(component: string) {
	const ctx = useContext(SelectContext);
	if (!ctx) throw new Error(`${component} must be used within <Select>`);
	return ctx;
}

export interface SelectProps {
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	disabled?: boolean;
	error?: boolean | string;
	dir?: "ltr" | "rtl";
	className?: string;
	children: ReactNode;
}

export function MotionSelect({
	value,
	defaultValue,
	onValueChange,
	disabled = false,
	error = false,
	dir = "ltr",
	className,
	children,
}: SelectProps) {
	const reduce = useReducedMotion() ?? false;
	const baseId = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);
	const [internal, setInternal] = useState(defaultValue);
	const [labels, setLabels] = useState<Map<string, string>>(new Map());
	const [placement, setPlacement] = useState<Placement>("bottom");
	const [searchQuery, setSearchQuery] = useState("");

	const controlled = value !== undefined;
	const current = controlled ? value : internal;
	const hasError = Boolean(error);

	const select = useCallback(
		(next: string) => {
			if (!controlled) setInternal(next);
			onValueChange?.(next);
			setOpen(false);
			setSearchQuery("");
		},
		[controlled, onValueChange],
	);

	const register = useCallback((v: string, label: string) => {
		setLabels((m) => (m.get(v) === label ? m : new Map(m).set(v, label)));
	}, []);

	const unregister = useCallback((v: string) => {
		setLabels((m) => {
			if (!m.has(v)) return m;
			const next = new Map(m);
			next.delete(v);
			return next;
		});
	}, []);

	// close on outside pointer / escape
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		const onPointer = (e: PointerEvent) => {
			if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		window.addEventListener("keydown", onKey);
		window.addEventListener("pointerdown", onPointer);
		return () => {
			window.removeEventListener("keydown", onKey);
			window.removeEventListener("pointerdown", onPointer);
		};
	}, [open]);

	const ctx = useMemo<SelectContextValue>(
		() => ({
			value: current,
			open,
			setOpen,
			select,
			register,
			unregister,
			labelFor: (v) => (v === undefined ? undefined : labels.get(v)),
			reduce,
			triggerId: `${baseId}-trigger`,
			listId: `${baseId}-list`,
			disabled,
			error: hasError,
			dir,
			placement,
			setPlacement,
			searchQuery,
			setSearchQuery,
		}),
		[
			current,
			open,
			select,
			register,
			unregister,
			labels,
			reduce,
			baseId,
			disabled,
			hasError,
			dir,
			placement,
			searchQuery,
		],
	);

	return (
		<SelectContext.Provider value={ctx}>
			<div
				ref={rootRef}
				dir={dir}
				className={cn("relative w-full", dir === "rtl" && "text-right", className)}
			>
				{children}
			</div>
		</SelectContext.Provider>
	);
}

export interface SelectTriggerProps {
	className?: string;
	children: ReactNode;
}

export function SelectTrigger({ className, children }: SelectTriggerProps) {
	const ctx = useSelectContext("SelectTrigger");
	const isTop = ctx.placement === "top";
	const isRtl = ctx.dir === "rtl";
	const kf = ctx.open ? [0, 0, 12] : [12, 0, 12];
	const kfT: Transition = ctx.reduce
		? { duration: 0 }
		: ctx.open
			? { duration: 0.6, times: [0, 0.4, 1], ease: EASE_OUT }
			: { duration: 0.42, times: [0, 0.5, 1], ease: EASE_OUT };

	return (
		<motion.button
			type="button"
			id={ctx.triggerId}
			disabled={ctx.disabled}
			aria-haspopup="listbox"
			aria-expanded={ctx.open}
			aria-controls={ctx.listId}
			aria-invalid={ctx.error || undefined}
			onClick={() => ctx.setOpen(!ctx.open)}
			initial={false}
			animate={{
				borderTopLeftRadius: isTop ? kf : 12,
				borderTopRightRadius: isTop ? kf : 12,
				borderBottomLeftRadius: isTop ? 12 : kf,
				borderBottomRightRadius: isTop ? 12 : kf,
				x: ctx.error && ctx.open ? [0, -4, 4, -4, 4, 0] : 0,
			}}
			transition={{
				borderTopLeftRadius: isTop ? kfT : INSTANT_TRANSITION,
				borderTopRightRadius: isTop ? kfT : INSTANT_TRANSITION,
				borderBottomLeftRadius: isTop ? INSTANT_TRANSITION : kfT,
				borderBottomRightRadius: isTop ? INSTANT_TRANSITION : kfT,
				x: { duration: 0.3 },
			}}
			className={cn(
				"relative z-10 flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-input bg-background px-3.5 py-2 text-sm text-foreground outline-none transition-colors",
				isRtl && "flex-row-reverse text-right",
				ctx.open && !ctx.error && "border-foreground/40 ring-3 ring-ring/20",
				ctx.error && "border-destructive ring-3 ring-destructive/25",
				"hover:border-foreground/40",
				"disabled:pointer-events-none disabled:opacity-50",
				className,
			)}
		>
			{children}
			<motion.span
				aria-hidden
				animate={{ rotate: ctx.open ? 180 : 0 }}
				transition={ctx.reduce ? { duration: 0 } : CHEVRON_TRANSITION}
				className="text-muted-foreground shrink-0"
			>
				<HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={2} />
			</motion.span>
		</motion.button>
	);
}

export interface SelectValueProps {
	placeholder?: string;
	className?: string;
}

export function SelectValue({ placeholder, className }: SelectValueProps) {
	const ctx = useSelectContext("SelectValue");
	const label = ctx.labelFor(ctx.value);

	return (
		<span
			className={cn(
				"truncate text-sm font-medium",
				label ? "text-foreground" : "text-muted-foreground",
				className,
			)}
		>
			{label ?? placeholder ?? "Select..."}
		</span>
	);
}

export interface SelectContentProps {
	className?: string;
	children: ReactNode;
}

export function SelectContent({ className, children }: SelectContentProps) {
	const ctx = useSelectContext("SelectContent");
	const innerRef = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState(0);
	const open = ctx.open;
	const { setPlacement } = ctx;

	useLayoutEffect(() => {
		const node = innerRef.current;
		if (!node) return;
		const measure = () => setHeight(node.offsetHeight);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		return () => observer.disconnect();
	});

	useLayoutEffect(() => {
		if (!open) return;
		const trigger = document.getElementById(ctx.triggerId);
		const node = innerRef.current;
		if (!trigger || !node) return;
		const rect = trigger.getBoundingClientRect();
		const h = node.offsetHeight;
		const below = window.innerHeight - rect.bottom;
		const above = rect.top;
		setPlacement(below < h + 16 && above > below ? "top" : "bottom");
	}, [open, ctx.triggerId, setPlacement]);

	const isTop = ctx.placement === "top";
	const nearGap = open ? 8 : 0;
	const nearRadius = open ? 12 : 0;

	const gapT: Transition = open
		? { type: "spring", duration: 0.6, bounce: 0.5, delay: 0.12 }
		: { type: "spring", duration: 0.3, bounce: 0.1 };
	const radiusT: Transition = open
		? { duration: 0.3, ease: EASE_OUT, delay: 0.14 }
		: { duration: 0.16, ease: EASE_OUT };

	return (
		<motion.div
			id={ctx.listId}
			role="listbox"
			aria-labelledby={ctx.triggerId}
			aria-hidden={!open}
			initial={false}
			animate={
				ctx.reduce
					? { opacity: open ? 1 : 0, height: open ? height : 0 }
					: {
							opacity: open ? 1 : 0,
							height: open ? height : 0,
							marginTop: isTop ? 0 : nearGap,
							marginBottom: isTop ? nearGap : 0,
							borderTopLeftRadius: isTop ? 12 : nearRadius,
							borderTopRightRadius: isTop ? 12 : nearRadius,
							borderBottomLeftRadius: isTop ? nearRadius : 12,
							borderBottomRightRadius: isTop ? nearRadius : 12,
						}
			}
			transition={
				ctx.reduce
					? { duration: 0.12 }
					: {
							opacity: open ? { duration: 0.18 } : { duration: 0.16, delay: 0.12 },
							height: open
								? { type: "spring", duration: 0.42, bounce: 0.14 }
								: { duration: 0.26, ease: EASE_OUT, delay: 0.14 },
							marginTop: isTop ? INSTANT_TRANSITION : gapT,
							marginBottom: isTop ? gapT : INSTANT_TRANSITION,
							borderTopLeftRadius: isTop ? INSTANT_TRANSITION : radiusT,
							borderTopRightRadius: isTop ? INSTANT_TRANSITION : radiusT,
							borderBottomLeftRadius: isTop ? radiusT : INSTANT_TRANSITION,
							borderBottomRightRadius: isTop ? radiusT : INSTANT_TRANSITION,
						}
			}
			style={{
				transformOrigin: isTop ? "bottom" : "top",
				overflow: "hidden",
				pointerEvents: open ? "auto" : "none",
			}}
			className={cn(
				"absolute left-0 right-0 z-50 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg max-h-60 overflow-y-auto scrollbar-thin",
				isTop ? "bottom-full" : "top-full",
				className,
			)}
		>
			<motion.div
				ref={innerRef}
				variants={ctx.reduce ? undefined : LIST_VARIANTS}
				initial={false}
				animate={open ? "show" : "hidden"}
				className="p-1 space-y-0.5"
			>
				{children}
			</motion.div>
		</motion.div>
	);
}

export interface SelectItemProps {
	value: string;
	disabled?: boolean;
	className?: string;
	children: ReactNode;
}

export function SelectItem({ value, disabled = false, className, children }: SelectItemProps) {
	const ctx = useSelectContext("SelectItem");
	const selected = ctx.value === value;
	const label = typeof children === "string" ? children : value;

	useLayoutEffect(() => {
		ctx.register(value, label);
		return () => ctx.unregister(value);
	}, [ctx, value, label]);

	// Filter search
	if (ctx.searchQuery && !label.toLowerCase().includes(ctx.searchQuery.toLowerCase())) {
		return null;
	}

	const isRtl = ctx.dir === "rtl";

	return (
		<motion.li variants={ctx.reduce ? undefined : ITEM_VARIANTS} className="list-none">
			<button
				type="button"
				role="option"
				aria-selected={selected}
				disabled={disabled}
				onClick={() => ctx.select(value)}
				className={cn(
					"flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium outline-none transition-colors cursor-pointer",
					isRtl && "flex-row-reverse text-right",
					selected
						? "bg-accent text-accent-foreground font-semibold"
						: "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:bg-muted",
					disabled && "pointer-events-none opacity-40",
					className,
				)}
			>
				<span>{children}</span>
				{selected ? (
					<HugeiconsIcon icon={CheckIcon} size={14} className="text-primary shrink-0" />
				) : null}
			</button>
		</motion.li>
	);
}

export function SelectGroup({ children, className }: { children: ReactNode; className?: string }) {
	return <div className={cn("py-1", className)}>{children}</div>;
}

export function SelectLabel({ children, className }: { children: ReactNode; className?: string }) {
	const ctx = useSelectContext("SelectLabel");
	const isRtl = ctx.dir === "rtl";

	return (
		<div
			className={cn(
				"px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70 select-none",
				isRtl && "text-right",
				className,
			)}
		>
			{children}
		</div>
	);
}

export function SelectSearch({ placeholder = "Search options..." }: { placeholder?: string }) {
	const ctx = useSelectContext("SelectSearch");
	const isRtl = ctx.dir === "rtl";

	return (
		<div className="p-1.5 border-b border-border mb-1 flex items-center gap-2 px-2.5">
			<HugeiconsIcon icon={Search01Icon} size={14} className="text-muted-foreground shrink-0" />
			<input
				type="text"
				placeholder={placeholder}
				value={ctx.searchQuery}
				onChange={(e) => ctx.setSearchQuery(e.target.value)}
				className={cn(
					"w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none border-none",
					isRtl && "text-right",
				)}
			/>
		</div>
	);
}
