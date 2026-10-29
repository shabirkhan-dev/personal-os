import { Fragment, useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useCareer, useNow } from "../hooks/use-career";
import {
	daysBetween,
	dayAndTime,
	followUps,
	lastEvent,
	pipelineCounts,
	weekdayShort,
} from "../lib/career-math";
import { type Application, type Stage, STAGE_LABELS } from "../lib/career-model";
import { careerRoutes } from "../navigation";
import { CareerScreen } from "./career-screen";
import {
	AiTip,
	EmptyCard,
	FilterChip,
	ListCard,
	ListRow,
	ScreenTitle,
	SectionLabel,
} from "@/components/module-ui";

const ORDER: readonly Stage[] = ["offer", "interview", "applied", "saved", "closed"];

type Filter = "all" | Stage;

/** What the right side of a row says for its stage. */
function rowDetail(
	app: Application,
	now: Date,
	dueIds: ReadonlySet<string>,
): { subtitle: string; value: string } {
	const role = app.role || "Role not set";
	switch (app.stage) {
		case "interview":
			return app.interview
				? { subtitle: `${role} · ${dayAndTime(new Date(app.interview.at))}`, value: "Prep" }
				: { subtitle: `${role} · not booked yet`, value: "Book" };
		case "applied": {
			const applied = lastEvent(app, "applied");
			const days = applied ? daysBetween(applied, now) : 0;
			if (dueIds.has(app.id))
				return { subtitle: `${role} · ${days} days, no reply`, value: "Nudge" };
			const upcoming = app.followUpAt ? new Date(app.followUpAt) : null;
			return upcoming && upcoming > now && daysBetween(now, upcoming) < 7
				? {
						subtitle: `${role} · follow up ${weekdayShort(upcoming)}`,
						value: weekdayShort(upcoming),
					}
				: { subtitle: `${role} · ${days} day${days === 1 ? "" : "s"}`, value: `${days}d` };
		}
		case "saved":
			return { subtitle: [role, app.where].filter(Boolean).join(" · "), value: "Apply" };
		case "offer":
			return { subtitle: role, value: "Offer" };
		default:
			return { subtitle: role, value: "Closed" };
	}
}

/** Applications grouped by stage, with a stage filter. */
export function ApplicationsScreen() {
	const { apps, loading } = useCareer();
	const now = useNow();
	const [filter, setFilter] = useState<Filter>("all");
	const [showClosed, setShowClosed] = useState(false);

	const counts = pipelineCounts(apps);
	const open = apps.filter((app) => app.stage !== "closed");
	const dueIds = useMemo(
		() =>
			new Set(
				followUps(apps, now)
					.filter((item) => item.due)
					.map((item) => item.app.id),
			),
		[apps, now],
	);
	const groups = ORDER.filter((stage) =>
		filter === "all" ? stage !== "closed" || showClosed : stage === filter,
	)
		.map((stage) => ({ stage, apps: apps.filter((app) => app.stage === stage) }))
		.filter((group) => group.apps.length > 0);

	const savedMatch = apps.find((app) => app.stage === "saved");
	const filters: ReadonlyArray<{ id: Filter; label: string }> = [
		{ id: "all", label: `All ${open.length}` },
		{ id: "saved", label: `Saved ${counts.saved}` },
		{ id: "applied", label: `Applied ${counts.applied}` },
		{ id: "interview", label: `Interview ${counts.interview}` },
		...(counts.offer > 0 ? [{ id: "offer" as const, label: `Offer ${counts.offer}` }] : []),
	];

	return (
		<CareerScreen
			about={{ screen: "applications list" }}
			action={{
				icon: "Filled/Filter",
				label: showClosed ? "Hide closed applications" : "Show closed applications",
				onPress: () => setShowClosed((value) => !value),
			}}
		>
			<ScreenTitle eyebrow={`${open.length} in your pipeline`} title="Applications" />
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.filters}
			>
				{filters.map((option) => (
					<FilterChip
						key={option.id}
						label={option.label}
						selected={filter === option.id}
						onPress={() => setFilter(option.id)}
					/>
				))}
			</ScrollView>
			{!loading && groups.length === 0 ? (
				<EmptyCard
					icon="Briefcase"
					title={apps.length === 0 ? "No applications yet" : "Nothing in this stage"}
					body={
						apps.length === 0
							? "Paste a job link on Career Home, or add one by hand."
							: "Pick another stage above."
					}
				/>
			) : null}
			{groups.map((group) => (
				<Fragment key={group.stage}>
					<SectionLabel>{`${STAGE_LABELS[group.stage]} · ${group.apps.length}`}</SectionLabel>
					<ListCard>
						{group.apps.map((app, index) => {
							const detail = rowDetail(app, now, dueIds);
							return (
								<ListRow
									key={app.id}
									title={app.company}
									subtitle={detail.subtitle}
									value={detail.value}
									chevron
									dimmed={app.stage === "closed"}
									onPress={() => careerRoutes.application(app.id)}
									last={index === group.apps.length - 1}
								/>
							);
						})}
					</ListCard>
				</Fragment>
			))}
			{savedMatch ? (
				<AiTip>{`${savedMatch.company} is saved and waiting. Apply today while it's open.`}</AiTip>
			) : apps.length > 0 ? (
				<AiTip>Keep the pipeline full: two new applications a day.</AiTip>
			) : null}
		</CareerScreen>
	);
}

const styles = StyleSheet.create({
	filters: { gap: 8 },
});
