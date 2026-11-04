import { useEffect, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { ScreenTitle } from "@/components/module-ui";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { TextField } from "@/components/ui/text-field";
import { haptics } from "@/lib/haptics";
import { saveProfile } from "../data/health-actions";
import { useHealth } from "../hooks/use-health";
import { BLOOD_GROUPS, type BloodGroup, type Contact, emptyProfile } from "../lib/health-model";

const STEP_GOALS = ["5000", "8000", "10000", "12000"].map((value) => ({
	value,
	label: Number(value).toLocaleString("en"),
}));
const SLEEP_GOALS = [
	{ value: "420", label: "7 h" },
	{ value: "450", label: "7 h 30" },
	{ value: "480", label: "8 h" },
	{ value: "540", label: "9 h" },
];
import { Card, CardHead } from "./health-cards";
import { HealthScreen } from "./health-screen";

const split = (text: string) =>
	text
		.split(/[,\n]/)
		.map((item) => item.trim())
		.filter(Boolean);
const contact = (name: string, phone: string): Contact | null =>
	name.trim() || phone.trim() ? { name: name.trim(), phone: phone.trim() } : null;

const call = (phone: string) =>
	void Linking.openURL(`tel:${phone.replace(/[^\d+]/g, "")}`).catch((error: unknown) =>
		console.warn("[health] could not start a call", error),
	);

/** The facts a doctor, or someone helping in an emergency, needs: kept on your phone. */
export function HealthProfileScreen() {
	const { profile, loading } = useHealth();
	const [blood, setBlood] = useState<BloodGroup>("unknown");
	const [allergies, setAllergies] = useState("");
	const [conditions, setConditions] = useState("");
	const [emergencyName, setEmergencyName] = useState("");
	const [emergencyPhone, setEmergencyPhone] = useState("");
	const [doctorName, setDoctorName] = useState("");
	const [doctorPhone, setDoctorPhone] = useState("");
	const [notes, setNotes] = useState("");
	const [stepGoal, setStepGoal] = useState(String(emptyProfile.stepGoal));
	const [sleepGoal, setSleepGoal] = useState(String(emptyProfile.sleepGoal));
	const [notice, setNotice] = useState<string | null>(null);

	useEffect(() => {
		if (loading) return;
		setBlood(profile.bloodGroup);
		setAllergies(profile.allergies.join(", "));
		setConditions(profile.conditions.join(", "));
		setEmergencyName(profile.emergency?.name ?? "");
		setEmergencyPhone(profile.emergency?.phone ?? "");
		setDoctorName(profile.doctor?.name ?? "");
		setDoctorPhone(profile.doctor?.phone ?? "");
		setNotes(profile.notes);
		setStepGoal(String(profile.stepGoal));
		setSleepGoal(String(profile.sleepGoal));
	}, [loading, profile]);

	const save = async () => {
		try {
			await saveProfile({
				id: "profile",
				bloodGroup: blood,
				allergies: split(allergies),
				conditions: split(conditions),
				emergency: contact(emergencyName, emergencyPhone),
				doctor: contact(doctorName, doctorPhone),
				notes: notes.trim(),
				stepGoal: Number(stepGoal),
				sleepGoal: Number(sleepGoal),
			});
			haptics.success();
			setNotice("Saved.");
		} catch (error) {
			console.error("[health] could not save the profile", error);
			setNotice("Couldn't save on this phone. Try again.");
		}
	};

	return (
		<HealthScreen>
			<ScreenTitle eyebrow="Kept on your phone and in your backup" title="Health profile" />
			<Card>
				<CardHead title="Daily goals" />
				<ChoiceChips label="Steps" options={STEP_GOALS} value={stepGoal} onChange={setStepGoal} />
				<ChoiceChips
					label="Sleep"
					options={SLEEP_GOALS}
					value={sleepGoal}
					onChange={setSleepGoal}
				/>
			</Card>
			<Card>
				<CardHead title="Blood group" />
				<ChoiceChips
					options={BLOOD_GROUPS.map((value) => ({
						value,
						label: value === "unknown" ? "Don't know" : value,
					}))}
					value={blood}
					onChange={setBlood}
				/>
			</Card>
			<Card>
				<CardHead title="Allergies and conditions" />
				<TextField
					label="Allergies"
					value={allergies}
					onChangeText={setAllergies}
					placeholder="Penicillin, peanuts"
				/>
				<TextField
					label="Conditions"
					value={conditions}
					onChangeText={setConditions}
					placeholder="Asthma, high blood pressure"
				/>
			</Card>
			<Card>
				<CardHead title="Emergency contact" />
				<TextField label="Name" value={emergencyName} onChangeText={setEmergencyName} />
				<TextField
					label="Phone"
					value={emergencyPhone}
					onChangeText={setEmergencyPhone}
					keyboardType="phone-pad"
				/>
				{profile.emergency?.phone ? (
					<PillButton
						label={`Call ${profile.emergency.name || "contact"}`}
						variant="secondary"
						onPress={() => call(profile.emergency?.phone ?? "")}
					/>
				) : null}
			</Card>
			<Card>
				<CardHead title="Your doctor" />
				<TextField label="Name" value={doctorName} onChangeText={setDoctorName} />
				<TextField
					label="Phone"
					value={doctorPhone}
					onChangeText={setDoctorPhone}
					keyboardType="phone-pad"
				/>
			</Card>
			<Card>
				<TextField
					label="Anything else a doctor should know"
					value={notes}
					onChangeText={setNotes}
					placeholder="Surgery in 2021, family history of diabetes"
				/>
			</Card>
			<View style={styles.save}>
				<PillButton label="Save" onPress={() => void save()} />
				{notice ? (
					<PoText variant="meta13" tone="textSecondary" style={styles.center}>
						{notice}
					</PoText>
				) : null}
			</View>
		</HealthScreen>
	);
}

const styles = StyleSheet.create({
	save: { gap: 8 },
	center: { textAlign: "center" },
});
