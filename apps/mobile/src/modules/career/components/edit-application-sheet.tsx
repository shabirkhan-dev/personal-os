import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { Sheet } from "@/components/ui/sheet";
import { updateApplication } from "../data/career-actions";
import type { Application } from "../lib/career-model";
import { FieldGroup, FieldRow, TextBox } from "./field-rows";

export type EditApplicationSheetProps = {
	visible: boolean;
	app: Application;
	onClose: () => void;
	onDelete: () => void;
};

/** Every editable field of one application, plus delete. */
export function EditApplicationSheet({
	visible,
	app,
	onClose,
	onDelete,
}: EditApplicationSheetProps) {
	const [fields, setFields] = useState({
		company: app.company,
		role: app.role,
		pay: app.pay,
		where: app.where,
		cv: app.cv,
		link: app.link,
		contactName: app.contact?.name ?? "",
		contactRole: app.contact?.role ?? "",
		email: app.contact?.email ?? "",
	});
	const [notes, setNotes] = useState(app.notes);
	const [error, setError] = useState<string | null>(null);
	const set = (key: keyof typeof fields) => (value: string) =>
		setFields((current) => ({ ...current, [key]: value }));

	const save = async () => {
		if (!fields.company.trim()) return setError("Every application needs a company.");
		const contact = {
			name: fields.contactName.trim(),
			role: fields.contactRole.trim(),
			email: fields.email.trim(),
		};
		try {
			await updateApplication({
				...app,
				company: fields.company.trim(),
				role: fields.role.trim(),
				pay: fields.pay.trim(),
				where: fields.where.trim(),
				cv: fields.cv.trim(),
				link: fields.link.trim(),
				notes: notes.trim(),
				contact: contact.name || contact.email ? contact : null,
			});
			onClose();
		} catch (caught) {
			console.error("[career] could not save the application", caught);
			setError("Couldn't save on this phone. Try again.");
		}
	};

	return (
		<Sheet
			visible={visible}
			title="Edit application"
			onClose={onClose}
			action={{ label: "Save", onPress: () => void save() }}
		>
			<FieldGroup>
				<FieldRow label="Company" value={fields.company} onChangeText={set("company")} />
				<FieldRow label="Role" value={fields.role} onChangeText={set("role")} />
				<FieldRow label="Pay" value={fields.pay} onChangeText={set("pay")} />
				<FieldRow label="Where" value={fields.where} onChangeText={set("where")} />
				<FieldRow label="CV" value={fields.cv} onChangeText={set("cv")} />
				<FieldRow
					label="Job post"
					value={fields.link}
					onChangeText={set("link")}
					keyboardType="url"
					last
				/>
			</FieldGroup>
			<PoText variant="eyebrow11" tone="textTertiary" style={styles.label}>
				Contact
			</PoText>
			<FieldGroup>
				<FieldRow label="Name" value={fields.contactName} onChangeText={set("contactName")} />
				<FieldRow label="Their role" value={fields.contactRole} onChangeText={set("contactRole")} />
				<FieldRow
					label="Email"
					value={fields.email}
					onChangeText={set("email")}
					keyboardType="email-address"
					last
				/>
			</FieldGroup>
			<PoText variant="eyebrow11" tone="textTertiary" style={styles.label}>
				Notes
			</PoText>
			<TextBox
				label="Notes"
				value={notes}
				onChangeText={setNotes}
				placeholder="Stack, people, what to mention"
			/>
			{error ? (
				<PoText variant="meta13" tone="textDanger">
					{error}
				</PoText>
			) : null}
			<View style={styles.delete}>
				<PillButton label="Delete application" variant="ghost" onPress={onDelete} />
			</View>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	label: { paddingLeft: 6, paddingTop: 4 },
	delete: { paddingTop: 4 },
});
