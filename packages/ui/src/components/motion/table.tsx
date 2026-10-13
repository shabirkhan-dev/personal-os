"use client";

import {
	ArrowDown01Icon,
	ArrowLeft01Icon,
	ArrowRight01Icon,
	ArrowUp01Icon,
	ArrowUpDownIcon,
	ChevronDownIcon,
	InboxIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Skeleton } from "@starter/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@starter/ui/components/table";
import { EASE_OUT, SPRING_PRESS, SPRING_SWAP } from "@starter/ui/lib/ease";
import { cn } from "@starter/ui/lib/utils";
import type { HTMLMotionProps } from "motion/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
	type ComponentPropsWithoutRef,
	createContext,
	forwardRef,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

/* ------------------------------------------------------------------ */
/* Density & row pattern variants                                      */
/* ------------------------------------------------------------------ */

export type TableDensity = "compact" | "default" | "comfortable";
export type TableRowStyle = "plain" | "striped";

const DENSITY_CELL: Record<TableDensity, string> = {
	compact: "py-1.5",
	default: "py-2",
	comfortable: "py-3.5",
};

const DENSITY_HEAD: Record<TableDensity, string> = {
	compact: "h-8",
	default: "h-10",
	comfortable: "h-12",
};

const TableSettingsContext = createContext<{
	density: TableDensity;
	rowStyle: TableRowStyle;
}>({ density: "default", rowStyle: "plain" });

/* ------------------------------------------------------------------ */
/* MotionTable                                                         */
/* ------------------------------------------------------------------ */

export interface MotionTableProps extends ComponentPropsWithoutRef<typeof Table> {
	density?: TableDensity;
	rowStyle?: TableRowStyle;
	className?: string;
}

export const MotionTable = forwardRef<HTMLTableElement, MotionTableProps>(
	({ density = "default", rowStyle = "plain", className, ...props }, ref) => {
		const contextValue = useMemo(() => ({ density, rowStyle }), [density, rowStyle]);

		return (
			<TableSettingsContext.Provider value={contextValue}>
				<Table
					ref={ref}
					data-density={density}
					data-row-style={rowStyle}
					className={cn("w-full border-collapse", className)}
					{...props}
				/>
			</TableSettingsContext.Provider>
		);
	},
);

MotionTable.displayName = "MotionTable";

/* ------------------------------------------------------------------ */
/* MotionTableRow                                                      */
/* ------------------------------------------------------------------ */

export interface MotionTableRowProps extends Omit<HTMLMotionProps<"tr">, "children" | "className"> {
	index?: number;
	selected?: boolean;
	interactive?: boolean;
	children?: ReactNode;
	className?: string;
}

export const MotionTableRow = forwardRef<HTMLTableRowElement, MotionTableRowProps>(
	({ index = 0, selected = false, interactive = true, children, className, ...props }, ref) => {
		const reduce = useReducedMotion();
		const { rowStyle } = useContext(TableSettingsContext);

		return (
			<motion.tr
				ref={ref}
				initial={reduce ? false : { opacity: 0, y: 6 }}
				animate={reduce ? undefined : { opacity: 1, y: 0 }}
				exit={reduce ? undefined : { opacity: 0, y: -6 }}
				transition={{
					duration: 0.25,
					delay: Math.min(index * 0.03, 0.3),
					ease: "easeOut",
				}}
				whileHover={
					interactive && !reduce ? { backgroundColor: "rgba(255,255,255,0.03)" } : undefined
				}
				className={cn(
					"border-b border-border/60 transition-colors select-none",
					rowStyle === "striped" && "odd:bg-muted/30",
					selected && "bg-primary/10 border-primary/30",
					interactive && "cursor-pointer hover:bg-muted/50",
					className,
				)}
				{...props}
			>
				{children}
			</motion.tr>
		);
	},
);

MotionTableRow.displayName = "MotionTableRow";

/* ------------------------------------------------------------------ */
/* Density-aware cell / head                                           */
/* ------------------------------------------------------------------ */

/** Table cell that inherits the density set on `MotionTable`. */
export function MotionTableCell({
	className,
	...props
}: ComponentPropsWithoutRef<typeof TableCell>) {
	const { density } = useContext(TableSettingsContext);
	return <TableCell className={cn(DENSITY_CELL[density], className)} {...props} />;
}

/** Table head cell that inherits the density set on `MotionTable`. */
export function MotionTableHead({
	className,
	...props
}: ComponentPropsWithoutRef<typeof TableHead>) {
	const { density } = useContext(TableSettingsContext);
	return <TableHead className={cn(DENSITY_HEAD[density], className)} {...props} />;
}

/* ------------------------------------------------------------------ */
/* Sorting                                                             */
/* ------------------------------------------------------------------ */

export type SortDirection = "asc" | "desc" | null;

export interface UseTableSortOptions<T> {
	key: keyof T;
	direction?: SortDirection;
	compare?: (a: T, b: T, key: keyof T, direction: "asc" | "desc") => number;
}

export interface TableSortState {
	sortKey: string | null;
	sortDirection: SortDirection;
	toggleSort: (key: string) => void;
	clearSort: () => void;
}

/** Sort state for a `TableSortHead` — the table body applies `sortedRows`. */
export function useTableSort<T>(options?: Partial<UseTableSortOptions<T>>): TableSortState {
	const [sortKey, setSortKey] = useState<string | null>(options?.key ? String(options.key) : null);
	const [sortDirection, setSortDirection] = useState<SortDirection>(options?.direction ?? null);

	const toggleSort = useCallback((key: string) => {
		setSortKey((prevKey) => {
			if (prevKey !== key) return key;
			setSortDirection((prevDir) => {
				if (prevDir === null) return "asc";
				if (prevDir === "asc") return "desc";
				return null;
			});
			return prevKey;
		});
	}, []);

	const clearSort = useCallback(() => {
		setSortKey(null);
		setSortDirection(null);
	}, []);

	return { sortKey, sortDirection, toggleSort, clearSort };
}

export function sortRows<T>(
	rows: T[],
	state: Pick<TableSortState, "sortKey" | "sortDirection">,
	options?: Partial<UseTableSortOptions<T>>,
): T[] {
	if (!state.sortKey || !state.sortDirection) return rows;
	const key = state.sortKey as keyof T;
	const direction: "asc" | "desc" = state.sortDirection;
	return rows.toSorted((a, b) => {
		if (options?.compare) return options.compare(a, b, key, direction);
		const aVal = a[key];
		const bVal = b[key];
		const cmp =
			typeof aVal === "number" && typeof bVal === "number"
				? aVal - bVal
				: String(aVal).localeCompare(String(bVal));
		return direction === "asc" ? cmp : -cmp;
	});
}

export interface TableSortHeadProps extends ComponentPropsWithoutRef<typeof TableHead> {
	sortDirection?: SortDirection;
	onSort?: () => void;
	children?: ReactNode;
	className?: string;
}

export function TableSortHead({
	sortDirection = null,
	onSort,
	children,
	className,
	...props
}: TableSortHeadProps) {
	const reduce = useReducedMotion();

	return (
		<TableHead
			className={cn(
				"cursor-pointer select-none group/sort-head transition-colors hover:text-foreground",
				className,
			)}
			onClick={onSort}
			{...props}
		>
			<div className="flex items-center gap-1.5 py-1">
				<span>{children}</span>
				<motion.span
					animate={sortDirection ? { opacity: 1, scale: 1 } : { opacity: 0.4, scale: 0.9 }}
					whileHover={!reduce ? { scale: 1.15 } : undefined}
					transition={SPRING_PRESS}
					className="text-muted-foreground group-hover/sort-head:text-foreground"
				>
					{sortDirection === "asc" ? (
						<HugeiconsIcon icon={ArrowUp01Icon} size={14} className="stroke-[2.5] text-primary" />
					) : sortDirection === "desc" ? (
						<HugeiconsIcon icon={ArrowDown01Icon} size={14} className="stroke-[2.5] text-primary" />
					) : (
						<HugeiconsIcon icon={ArrowUpDownIcon} size={14} />
					)}
				</motion.span>
			</div>
		</TableHead>
	);
}

/* ------------------------------------------------------------------ */
/* Selection                                                           */
/* ------------------------------------------------------------------ */

export interface TableSelectionState {
	selectedKeys: Set<string>;
	isAllSelected: boolean;
	isIndeterminate: boolean;
	toggleRow: (key: string) => void;
	toggleAll: () => void;
	clearSelection: () => void;
	selectAll: () => void;
}

export function useTableSelection(rowKeys: string[] | ReadonlyArray<string>): TableSelectionState {
	const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());

	const isAllSelected = rowKeys.length > 0 && rowKeys.every((k) => selectedKeys.has(k));
	const isIndeterminate = !isAllSelected && rowKeys.some((k) => selectedKeys.has(k));

	const toggleRow = useCallback((key: string) => {
		setSelectedKeys((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}, []);

	const toggleAll = useCallback(() => {
		setSelectedKeys((prev) => {
			const allSelected = rowKeys.length > 0 && rowKeys.every((k) => prev.has(k));
			if (allSelected) return new Set();
			return new Set(rowKeys);
		});
	}, [rowKeys]);

	const clearSelection = useCallback(() => setSelectedKeys(new Set()), []);
	const selectAll = useCallback(() => setSelectedKeys(new Set(rowKeys)), [rowKeys]);

	return {
		selectedKeys,
		isAllSelected,
		isIndeterminate,
		toggleRow,
		toggleAll,
		clearSelection,
		selectAll,
	};
}

/* ------------------------------------------------------------------ */
/* Expandable rows                                                     */
/* ------------------------------------------------------------------ */

export interface MotionTableExpandableRowProps {
	expanded?: boolean;
	onExpand?: (expanded: boolean) => void;
	rowIndex?: number;
	selected?: boolean;
	interactive?: boolean;
	/** Extra cells rendered in the main (clickable) row. */
	children?: ReactNode;
	/** Content rendered in the expanded detail row (spans the remaining columns). */
	detail?: ReactNode;
	/** Number of columns the detail row should span. */
	colSpan?: number;
	mainRowClassName?: string;
	detailRowClassName?: string;
	className?: string;
}

/**
 * A row that toggles an animated detail row beneath it when clicked.
 * The chevron rotates 180deg on expand using shared spring physics.
 */
export const MotionTableExpandableRow = forwardRef<
	HTMLTableRowElement,
	MotionTableExpandableRowProps
>(
	(
		{
			expanded = false,
			onExpand,
			rowIndex = 0,
			selected = false,
			interactive = true,
			children,
			detail,
			colSpan = 1,
			mainRowClassName,
			detailRowClassName,
			className,
		},
		ref,
	) => {
		const reduce = useReducedMotion();
		const { density } = useContext(TableSettingsContext);

		return (
			<>
				<MotionTableRow
					ref={ref}
					index={rowIndex}
					selected={selected}
					interactive={interactive}
					onClick={interactive ? () => onExpand?.(!expanded) : undefined}
					className={cn(mainRowClassName, className)}
				>
					<TableCell
						className={cn(
							DENSITY_CELL[density],
							"w-10 text-center text-muted-foreground",
							interactive && "cursor-pointer",
						)}
						onClick={interactive ? () => onExpand?.(!expanded) : undefined}
					>
						<motion.span
							animate={{ rotate: expanded ? 180 : 0 }}
							transition={reduce ? { duration: 0 } : SPRING_SWAP}
							className="inline-flex"
						>
							<HugeiconsIcon icon={ChevronDownIcon} size={14} />
						</motion.span>
					</TableCell>
					{children}
				</MotionTableRow>
				<AnimatePresence initial={false}>
					{expanded && (
						<motion.tr
							key="expand-detail"
							initial={reduce ? false : { opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={reduce ? undefined : { opacity: 0, height: 0 }}
							transition={
								reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28 }
							}
							className={cn("border-b border-border/60 bg-muted/30", detailRowClassName)}
						>
							<TableCell colSpan={colSpan} className="px-10 py-0">
								<motion.div
									initial={reduce ? false : { opacity: 0, y: -4 }}
									animate={{ opacity: 1, y: 0 }}
									transition={reduce ? { duration: 0 } : SPRING_SWAP}
								>
									{detail}
								</motion.div>
							</TableCell>
						</motion.tr>
					)}
				</AnimatePresence>
			</>
		);
	},
);

MotionTableExpandableRow.displayName = "MotionTableExpandableRow";

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

export interface TableEmptyStateProps {
	colSpan?: number;
	message?: string;
	description?: string;
	icon?: ReactNode;
	action?: ReactNode;
	className?: string;
}

export function TableEmptyState({
	colSpan = 1,
	message = "No results found",
	description,
	icon,
	action,
	className,
}: TableEmptyStateProps) {
	const reduce = useReducedMotion();

	return (
		<motion.tr
			initial={reduce ? false : { opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: EASE_OUT }}
			className={cn("border-b border-border/60", className)}
		>
			<TableCell colSpan={colSpan} className="py-14 text-center">
				<motion.div
					animate={!reduce ? { y: [0, -3, 0] } : undefined}
					transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
					className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl border border-border bg-muted/50 text-muted-foreground"
				>
					{icon ?? <HugeiconsIcon icon={InboxIcon} size={22} />}
				</motion.div>
				<p className="text-sm font-medium text-foreground">{message}</p>
				{description && (
					<p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
				)}
				{action && <div className="mt-4 flex justify-center">{action}</div>}
			</TableCell>
		</motion.tr>
	);
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

export interface MotionTablePaginationProps {
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	totalItems?: number;
	pageSize?: number;
	className?: string;
}

const paginationBtnClass = (disabled: boolean) =>
	cn(
		"inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors",
		disabled
			? "cursor-not-allowed opacity-40"
			: "cursor-pointer hover:bg-muted/60 hover:text-foreground",
	);

export function MotionTablePagination({
	page,
	totalPages,
	onPageChange,
	totalItems,
	pageSize,
	className,
}: MotionTablePaginationProps) {
	const reduce = useReducedMotion();
	const canPrev = page > 1;
	const canNext = page < totalPages;
	const from = totalItems != null && pageSize != null ? (page - 1) * pageSize + 1 : null;
	const to = totalItems != null && pageSize != null ? Math.min(page * pageSize, totalItems) : null;

	return (
		<div className={cn("flex items-center justify-between px-2 pt-3", className)}>
			<span className="text-xs font-mono text-muted-foreground">
				{from != null && to != null ? `${from}–${to}` : `Page ${page}`}
				{totalItems != null ? ` of ${totalItems}` : ""}
			</span>
			<div className="flex items-center gap-2">
				<motion.button
					type="button"
					disabled={!canPrev}
					whileTap={!reduce && canPrev ? { scale: 0.9 } : undefined}
					transition={SPRING_PRESS}
					onClick={() => onPageChange(page - 1)}
					className={paginationBtnClass(!canPrev)}
					aria-label="Previous page"
				>
					<HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
				</motion.button>
				<span className="min-w-12 text-center text-xs font-mono text-foreground">
					{page} / {totalPages}
				</span>
				<motion.button
					type="button"
					disabled={!canNext}
					whileTap={!reduce && canNext ? { scale: 0.9 } : undefined}
					transition={SPRING_PRESS}
					onClick={() => onPageChange(page + 1)}
					className={paginationBtnClass(!canNext)}
					aria-label="Next page"
				>
					<HugeiconsIcon icon={ArrowRight01Icon} size={14} />
				</motion.button>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Skeleton & helpers                                                  */
/* ------------------------------------------------------------------ */

export interface MotionTableSkeletonProps {
	rows?: number;
	columns?: number;
	className?: string;
}

export function MotionTableSkeleton({
	rows = 4,
	columns = 4,
	className,
}: MotionTableSkeletonProps) {
	return (
		<TableBody className={className}>
			{Array.from({ length: rows }).map((_, rIdx) => (
				// oxlint-disable-next-line react/no-array-index-key -- static skeleton placeholders, never reordered
				<TableRow key={`skeleton-row-${rIdx}`} className="border-b border-border/40">
					{Array.from({ length: columns }).map((_col, cIdx) => (
						// oxlint-disable-next-line react/no-array-index-key -- static skeleton placeholders, never reordered
						<TableCell key={`skeleton-cell-${rIdx}-${cIdx}`} className="py-3.5">
							<Skeleton className="h-4 w-full rounded-md opacity-60" />
						</TableCell>
					))}
				</TableRow>
			))}
		</TableBody>
	);
}
