import { router } from "expo-router";
import { useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, View } from "react-native";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { confirmHalal, deleteApplication, setStage } from "../data/career-actions";
import { findApp, useCareer, useNow } from "../hooks/use-career";
import {
	daysBetween,
	dayAndTime,
	lastEvent,
	shortDate,
	startOfDay,
	weekdayShort,
} from "../lib/career-math";
import type { Application } from "../lib/career-model";
import { careerRoutes } from "../navigation";
import { CareerScreen } from "./career-screen";
import {
	AiTip,
	EmptyCard,
	Footer,
	ListCard,
	ListRow,
	MetaChip,
	ScreenTitle,
	SectionLabel,
	TimelineRow,
	type TimelineState,
} from "@/components/module-ui";
import { EditApplicationSheet } from "./edit-application-sheet";
import { InterviewSheet } from "./interview-sheet";
import { NudgeSheet } from "./nudge-sheet";

type Step = {
	when: string;
	title: string;
	note: string;
	state: TimelineState;
	onPress?: () => void;
};

function host(link: string): string {
	try {
		const url = new URL(link);
		return `${url.hostname.replace(/^www\./, "")}${url.pathname === "/" ? "" : url.pathname}`;
	} catch {
		return link;
	}
}

function steps(
	app: Application,
	now: Date,
	actions: { apply: () => void; book: () => void; offer: () => void },
): Step[] {
	const applied = lastEvent(app, "applied");
	const saved = lastEvent(app, "saved") ?? new Date(app.createdAt);
	const list: Step[] = [];
	if (app.stage === "saved" || !applied) {
		list.push({
			when: shortDate(saved),
			title: "Saved",
			note: app.cv ? `CV · ${app.cv}` : "Waiting for you to apply",
			state: "done",
		});
		list.push({
			when: "—",
			title: "Apply",
			note: "Then I'll remind you to follow up",
			state: app.stage === "saved" ? "next" : "done",
			onPress: app.stage === "saved" ? actions.apply : undefined,
		});
	} else {
		list.push({
			when: shortDate(applied),
			title: "Applied",
			note: app.cv ? `CV · ${app.cv}` : "Sent",
			state: "done",
		});
	}
	const later = app.stage === "interview" || app.stage === "offer";
	if (app.stage !== "saved") {
		const followUp = app.followUpAt ? new Date(app.followUpAt) : null;
		const days = applied ? daysBetween(applied, now) : 0;
		const due = followUp !== null && followUp < new Date(startOfDay(now).getTime() + 86_400_000);
		list.push({
			when: followUp ? (daysBetween(now, followUp) === 0 ? "Today" : shortDate(followUp)) : "—",
			title: "Follow up",
			note: later
				? "They replied"
				: due
					? `No reply in ${days} days — nudge`
					: followUp
						? `Reminder ${weekdayShort(followUp)}`
						: "No reminder set",
			state: later ? "done" : app.stage === "applied" ? "next" : "later",
		});
	}
	list.push({
		when: app.interview ? shortDate(new Date(app.interview.at)) : "—",
		title: "Interview",
		note: app.interview
			? `${app.interview.round || "Interview"} · ${dayAndTime(new Date(app.interview.at))}`
			: "Not booked yet",
		state: app.stage === "offer" ? "done" : app.stage === "interview" ? "next" : "later",
		onPress: app.stage === "closed" ? undefined : actions.book,
	});
	list.push({
		when: app.stage === "offer" ? shortDate(lastEvent(app, "offer") ?? now) : "—",
		title: "Offer",
		note:
			app.stage === "offer"
				? "Received — negotiate before you accept"
				: "Negotiate before you accept",
		state: app.stage === "offer" ? "done" : "later",
		onPress: app.stage === "interview" ? actions.offer : undefined,
	});
	return list;
}

function tipFor(app: Application, now: Date): string {
	switch (app.stage) {
		case "saved":
			return "Apply while it's fresh. I'll set a follow-up for a week later.";
		case "applied": {
			const due = app.followUpAt !== null && new Date(app.followUpAt) <= now;
			return due
				? "A nudge is due. I'll draft three short lines from your notes for you to review."
				: "Waiting on a reply. Add the recruiter as a contact so the nudge goes to the right person.";
		}
		case "interview":
			return `Build your prep: topics, your stories and flashcards for ${app.company}.`;
		case "offer":
			return "Get the offer in writing and compare it with your runway before you answer.";
		default:
			return "Closed. Keep what you learned in the notes for the next one.";
	}
}

export function ApplicationDetailScreen({ id }: { id: string }) {
	const { colors } = usePoTheme();
	const data = useCareer();
	const now = useNow();
	const app = findApp(data, id);
	const [sheet, setSheet] = useState<"edit" | "interview" | "nudge" | null>(null);

	if (!app) {
		return (
			<CareerScreen>
				<EmptyCard
					icon="Briefcase"
					title={data.loading ? "Loading…" : "Application not found"}
					body={data.loading ? "" : "It may have been deleted on another device."}
				/>
			</CareerScreen>
		);
	}

	const move = (stage: Application["stage"]) =>
		void setStage(app, stage).catch((error: unknown) =>
			console.error("[career] could not update", error),
		);

	const confirmDelete = () =>
		Alert.alert(
			"Delete application?",
			`${app.company} and its prep will be removed from all your devices.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: () => {
						setSheet(null);
						void deleteApplication(
							app,
							data.cards.filter((card) => card.deckId === app.id),
						)
							.then(() => router.back())
							.catch((error: unknown) => console.error("[career] could not delete", error));
					},
				},
			],
		);

	const timeline = steps(app, now, {
		apply: () => move("applied"),
		book: () => setSheet("interview"),
		offer: () =>
			Alert.alert("Record an offer?", `Mark ${app.company} as an offer.`, [
				{ text: "Cancel", style: "cancel" },
				{ text: "Offer received", onPress: () => move("offer") },
			]),
	});
	const stageDate = lastEvent(app, app.stage === "saved" ? "saved" : "applied");
	const halalLabel = app.halal.confirmed
		? "Clean income"
		: app.halal.status === "flagged"
			? "Halal: flagged"
			: "Halal: check";

	return (
		<CareerScreen
			about={{ screen: "application detail", recordId: app.id }}
			action={{ icon: "Filled/Edit", label: "Edit application", onPress: () => setSheet("edit") }}
		>
			<ScreenTitle
				eyebrow={[app.where, app.role].filter(Boolean).join(" · ") || "Application"}
				title={app.company}
			>
				{app.pay ? <MetaChip icon="Wallet" label={app.pay} /> : null}
				{stageDate ? (
					<MetaChip
						icon="Filled/Calendar"
						iconTone="statusCaution"
						label={`${app.stage === "saved" ? "Saved" : "Applied"} ${shortDate(stageDate)}`}
					/>
				) : null}
				<MetaChip
					icon={app.halal.confirmed ? "Line/Check" : "Help"}
					iconTone={
						app.halal.confirmed
							? "statusSuccess"
							: app.halal.status === "flagged"
								? "statusDanger"
								: "textSecondary"
					}
					label={halalLabel}
					onPress={
						app.halal.confirmed
							? undefined
							: () =>
									Alert.alert(
										"Halal check",
										app.halal.note || "Check what the company earns from before you go further.",
										[
											{ text: "Later", style: "cancel" },
											{
												text: "I've checked — clean",
												onPress: () =>
													void confirmHalal(app).catch((error: unknown) =>
														console.error("[career] could not confirm the halal check", error),
													),
											},
										],
									)
					}
				/>
				{app.where ? <MetaChip icon="Clock" label={app.where} /> : null}
			</ScreenTitle>

			<View
				style={[
					styles.status,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				<PoText variant="title18">Status</PoText>
				{timeline.map((step, index) => (
					<TimelineRow key={step.title} {...step} last={index === timeline.length - 1} />
				))}
			</View>

			<SectionLabel>Contact</SectionLabel>
			<ListCard>
				{app.contact ? (
					<ListRow
						title={app.contact.name || app.contact.email}
						subtitle={
							[app.contact.role, app.contact.email ? "email" : ""].filter(Boolean).join(" · ") ||
							undefined
						}
						value={app.contact.email ? "Email" : "Edit"}
						chevron
						onPress={() =>
							app.contact?.email
								? void Linking.openURL(`mailto:${app.contact.email}`).catch(() => setSheet("edit"))
								: setSheet("edit")
						}
					/>
				) : (
					<ListRow
						title="Add a contact"
						subtitle="Recruiter or hiring manager"
						value="Add"
						chevron
						onPress={() => setSheet("edit")}
					/>
				)}
				<ListRow
					title="Job post"
					subtitle={app.link ? host(app.link) : "No link saved"}
					value={app.link ? "Open" : "Add"}
					chevron
					onPress={() =>
						app.link
							? void Linking.openURL(app.link).catch(() => setSheet("edit"))
							: setSheet("edit")
					}
					last
				/>
			</ListCard>

			<SectionLabel>Notes</SectionLabel>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Edit notes"
				onPress={() => setSheet("edit")}
				style={[
					styles.notes,
					{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				]}
			>
				<PoText variant="body15" tone={app.notes ? "textSecondary" : "textTertiary"}>
					{app.notes || "Stack, people, what to mention. Notes shape the AI's nudges and prep."}
				</PoText>
			</Pressable>

			<AiTip>{tipFor(app, now)}</AiTip>

			{app.stage === "closed" ? (
				<PillButton label="Reopen" variant="secondary" onPress={() => move("saved")} />
			) : (
				<Footer>
					<PillButton
						label="Mark closed"
						variant="secondary"
						style={styles.flex}
						onPress={() => move("closed")}
					/>
					{app.stage === "saved" ? (
						<PillButton label="Mark applied" style={styles.flex} onPress={() => move("applied")} />
					) : app.stage === "applied" ? (
						<PillButton label="Send nudge" style={styles.flex} onPress={() => setSheet("nudge")} />
					) : (
						<PillButton
							label="Interview prep"
							style={styles.flex}
							onPress={() => careerRoutes.prep(app.id)}
						/>
					)}
				</Footer>
			)}

			{sheet === "edit" ? (
				<EditApplicationSheet
					visible
					app={app}
					onClose={() => setSheet(null)}
					onDelete={confirmDelete}
				/>
			) : null}
			{sheet === "interview" ? (
				<InterviewSheet visible app={app} onClose={() => setSheet(null)} />
			) : null}
			{sheet === "nudge" ? (
				<NudgeSheet
					visible
					app={app}
					stories={data.stories}
					senderName={data.senderName}
					onClose={() => setSheet(null)}
					onSent={() => setSheet(null)}
				/>
			) : null}
		</CareerScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	status: {
		gap: 4,
		paddingTop: 16,
		paddingBottom: 6,
		paddingHorizontal: 16,
		borderRadius: 28,
		borderWidth: 1,
	},
	notes: { padding: 16, borderRadius: 28, borderWidth: 1 },
});
