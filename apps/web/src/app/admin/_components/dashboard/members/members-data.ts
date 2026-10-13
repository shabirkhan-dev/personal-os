export type MemberStatus = "active" | "pending" | "suspended";
export type MemberSource = "portal" | "walk-in" | "referral" | "transfer";

export type Member = {
	id: string;
	name: string;
	email: string;
	role: string;
	workspace: string;
	team: string;
	teamRole: string;
	location: string;
	date: string;
	status: MemberStatus;
	source: MemberSource;
	note: string;
};

export const members: Member[] = [
	{
		id: "#U-2041",
		name: "Amara Okafor",
		email: "amara.okafor@starter.dev",
		role: "Staff Engineer",
		workspace: "Production",
		team: "Engineering",
		teamRole: "Platform Lead",
		location: "US-West",
		date: "Jul 14, 2026",
		status: "active",
		source: "portal",
		note: "Two-factor auth enabled",
	},
	{
		id: "#U-2042",
		name: "Liam Bennett",
		email: "liam.bennett@starter.dev",
		role: "DevOps Engineer",
		workspace: "Staging",
		team: "Infrastructure",
		teamRole: "DevOps Lead",
		location: "EU-Central",
		date: "Jul 14, 2026",
		status: "pending",
		source: "walk-in",
		note: "Awaiting email confirmation",
	},
	{
		id: "#U-2043",
		name: "Sofia Reyes",
		email: "sofia.reyes@starter.dev",
		role: "Product Manager",
		workspace: "Production",
		team: "Product",
		teamRole: "Product Lead",
		location: "US-East",
		date: "Jul 13, 2026",
		status: "active",
		source: "referral",
		note: "Workspace admin access",
	},
	{
		id: "#U-2044",
		name: "Noah Kim",
		email: "noah.kim@starter.dev",
		role: "Frontend Lead",
		workspace: "Staging",
		team: "UI / Web",
		teamRole: "Core Team",
		location: "AP-South",
		date: "Jul 12, 2026",
		status: "suspended",
		source: "portal",
		note: "Seat quota reached — queued",
	},
	{
		id: "#U-2045",
		name: "Zara Ahmed",
		email: "zara.ahmed@starter.dev",
		role: "Security Lead",
		workspace: "Production",
		team: "Security",
		teamRole: "SecOps",
		location: "US-West",
		date: "Jul 11, 2026",
		status: "active",
		source: "transfer",
		note: "SAML SSO provisioned",
	},
	{
		id: "#U-2046",
		name: "Elias Novak",
		email: "elias.novak@starter.dev",
		role: "Backend Engineer",
		workspace: "Internal",
		team: "Platform",
		teamRole: "Core Team",
		location: "EU-West",
		date: "Jul 10, 2026",
		status: "pending",
		source: "portal",
		note: "Pending invite acceptance",
	},
];

export function memberSummary(rows: Member[]) {
	return {
		total: rows.length,
		pending: rows.filter((r) => r.status === "pending").length,
		waitlisted: rows.filter((r) => r.status === "suspended").length,
		enrolled: rows.filter((r) => r.status === "active").length,
	};
}
