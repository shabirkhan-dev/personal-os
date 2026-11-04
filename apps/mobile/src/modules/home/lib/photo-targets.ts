import { photoTarget } from "@/lib/photos/photo-sync";
import { pieces, wishes } from "@/modules/fashion/data/collections";
import { meals } from "@/modules/food/data/collections";
import { healthMedicines, healthRecords } from "@/modules/health/data/collections";
import { wishlistDreams, wishlistOwned } from "@/modules/wishlist/data/collections";
import type { Photo } from "@/modules/wishlist/lib/wishlist-model";

const filePhoto = (photo: Photo) => (photo?.kind === "file" ? photo.uri : null);

/**
 * Every collection whose records carry a photo the person took or picked. Each uploads to R2 and
 * keeps the link, so the photo follows the record to the person's other devices.
 */
export const PHOTO_TARGETS = [
	photoTarget(
		pieces,
		(piece) => piece.image,
		(piece, image) => ({ ...piece, image }),
	),
	photoTarget(
		wishes,
		(wish) => wish.image,
		(wish, image) => ({ ...wish, image }),
	),
	photoTarget(
		meals,
		(meal) => meal.photo,
		(meal, photo) => ({ ...meal, photo }),
	),
	photoTarget(
		healthMedicines,
		(medicine) => medicine.photo,
		(medicine, photo) => ({ ...medicine, photo }),
	),
	photoTarget(
		healthRecords,
		(record) => record.photo,
		(record, photo) => ({ ...record, photo }),
	),
	photoTarget(
		wishlistDreams,
		(dream) => filePhoto(dream.photo),
		(dream, uri) => ({ ...dream, photo: { kind: "file" as const, uri } }),
	),
	photoTarget(
		wishlistOwned,
		(owned) => filePhoto(owned.photo),
		(owned, uri) => ({ ...owned, photo: { kind: "file" as const, uri } }),
	),
];
