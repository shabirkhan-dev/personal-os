import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { type Member, newMemberNumber, parseMember } from "../lib/member-card";

const MEMBER_KEY = "personal-os.member";

type MemberState = {
	member: Member | null;
	/** Loads the card number, making and saving one the first time. */
	ensure: () => Promise<Member>;
};

export const useMemberStore = create<MemberState>()((set, get) => ({
	member: null,
	ensure: async () => {
		const known = get().member;
		if (known) return known;
		const stored = parseMember(await SecureStore.getItemAsync(MEMBER_KEY));
		const member = stored ?? { number: newMemberNumber(), since: new Date().toISOString() };
		if (!stored) await SecureStore.setItemAsync(MEMBER_KEY, JSON.stringify(member));
		set({ member });
		return member;
	},
}));
