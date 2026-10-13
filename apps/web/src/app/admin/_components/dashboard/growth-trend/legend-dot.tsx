type Props = {
	color: string;
	label: string;
};

export function LegendDot({ color, label }: Props) {
	return (
		<span className="inline-flex items-center gap-1.5 font-medium text-[10.5px] text-dashboard-text-muted uppercase tracking-[0.06em]">
			<span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
			{label}
		</span>
	);
}
