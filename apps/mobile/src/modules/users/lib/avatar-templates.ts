export type AvatarTemplate = {
	id: string;
	label: string;
	style: string;
};

/** Dicebear styles used as selectable avatar templates (public HTTPS URLs). */
export const AVATAR_TEMPLATE_STYLES: readonly AvatarTemplate[] = [
	{ id: "glass", label: "Glass", style: "glass" },
	{ id: "shapes", label: "Shapes", style: "shapes" },
	{ id: "bottts", label: "Bot", style: "bottts" },
	{ id: "lorelei", label: "Lorelei", style: "lorelei" },
	{ id: "avataaars", label: "Avatar", style: "avataaars" },
	{ id: "thumbs", label: "Thumbs", style: "thumbs" },
	{ id: "notionists", label: "Notion", style: "notionists" },
	{ id: "fun-emoji", label: "Emoji", style: "fun-emoji" },
] as const;

export function avatarTemplateUrl(style: string, seed: string): string {
	return `https://api.dicebear.com/9.x/${style}/png?seed=${encodeURIComponent(seed)}&size=256`;
}

export function buildAvatarTemplates(seed: string): Array<{
	id: string;
	label: string;
	url: string;
}> {
	const base = seed.trim() || "personal-os";
	return AVATAR_TEMPLATE_STYLES.map((template) => ({
		id: template.id,
		label: template.label,
		url: avatarTemplateUrl(template.style, `${base}-${template.id}`),
	}));
}
