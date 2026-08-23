export type AdmissionStatus = "enrolled" | "pending" | "waitlisted";
export type AdmissionSource = "portal" | "walk-in" | "referral" | "transfer";

export type Admission = {
	id: string;
	student: string;
	email: string;
	grade: string;
	campus: string;
	guardian: string;
	guardianRelation: string;
	guardianPhone: string;
	date: string;
	status: AdmissionStatus;
	source: AdmissionSource;
	note: string;
};

export const admissions: Admission[] = [
	{
		id: "#A-2041",
		student: "Amara Okafor",
		email: "amara.okafor@family.mail",
		grade: "Grade 1",
		campus: "Northwood",
		guardian: "Chidi Okafor",
		guardianRelation: "Father",
		guardianPhone: "+1 415 882 0141",
		date: "Jul 14, 2026",
		status: "enrolled",
		source: "portal",
		note: "Immunization packet complete",
	},
	{
		id: "#A-2042",
		student: "Liam Bennett",
		email: "liam.bennett@family.mail",
		grade: "Grade 4",
		campus: "Riverside",
		guardian: "Sarah Bennett",
		guardianRelation: "Mother",
		guardianPhone: "+1 628 441 9022",
		date: "Jul 14, 2026",
		status: "pending",
		source: "walk-in",
		note: "Awaiting prior record import",
	},
	{
		id: "#A-2043",
		student: "Sofia Reyes",
		email: "sofia.reyes@family.mail",
		grade: "Grade 7",
		campus: "Northwood",
		guardian: "Miguel Reyes",
		guardianRelation: "Father",
		guardianPhone: "+1 510 773 6610",
		date: "Jul 13, 2026",
		status: "enrolled",
		source: "referral",
		note: "Sibling already enrolled (G5)",
	},
	{
		id: "#A-2044",
		student: "Noah Kim",
		email: "noah.kim@family.mail",
		grade: "Grade 2",
		campus: "Riverside",
		guardian: "Grace Kim",
		guardianRelation: "Mother",
		guardianPhone: "+1 408 221 4481",
		date: "Jul 12, 2026",
		status: "waitlisted",
		source: "portal",
		note: "Grade 2 at capacity — offer pending",
	},
	{
		id: "#A-2045",
		student: "Zara Ahmed",
		email: "zara.ahmed@family.mail",
		grade: "Grade 10",
		campus: "Northwood",
		guardian: "Imran Ahmed",
		guardianRelation: "Father",
		guardianPhone: "+1 650 991 3304",
		date: "Jul 11, 2026",
		status: "enrolled",
		source: "transfer",
		note: "Credits mapped · counseling scheduled",
	},
	{
		id: "#A-2046",
		student: "Elias Novak",
		email: "elias.novak@family.mail",
		grade: "Grade 5",
		campus: "District",
		guardian: "Petra Novak",
		guardianRelation: "Mother",
		guardianPhone: "+1 925 604 1188",
		date: "Jul 10, 2026",
		status: "pending",
		source: "portal",
		note: "Fee deposit unpaid",
	},
];

export function admissionSummary(rows: Admission[]) {
	return {
		total: rows.length,
		pending: rows.filter((r) => r.status === "pending").length,
		waitlisted: rows.filter((r) => r.status === "waitlisted").length,
		enrolled: rows.filter((r) => r.status === "enrolled").length,
	};
}
