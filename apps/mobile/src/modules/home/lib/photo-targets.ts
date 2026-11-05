import type { RecordStore } from "@/lib/db/record-store";
import { type PhotoTarget, photoTarget } from "@/lib/photos/photo-sync";
import { pieces, wishes } from "@/modules/fashion/data/collections";
import { groceries, meals, myRecipes } from "@/modules/food/data/collections";
import { healthMedicines, healthRecords } from "@/modules/health/data/collections";
import { wishlistDreams, wishlistOwned } from "@/modules/wishlist/data/collections";
import type { Photo } from "@/modules/wishlist/lib/wishlist-model";

const filePhoto = (photo: Photo) => (photo?.kind === "file" ? photo.uri : null);

/** Grocery lists keep a photo per item, so each item on the phone uploads on its own. */
const groceryPhotos: PhotoTarget = {
	name: groceries.name,
	jobs: async (store: RecordStore) => {
		const lists = (await store.list(groceries.name)).flatMap((raw) => {
			const list = groceries.parse(raw);
			return list ? [list] : [];
		});
		return lists.flatMap((list) =>
			list.items.flatMap((item) => {
				const uri = item.photo;
				if (!uri?.startsWith("file://")) return [];
				return [
					{
						collection: groceries.name,
						id: `${list.id}:${item.id}`,
						uri,
						apply: async (url: string) => {
							const current = (await store.list(groceries.name))
								.map((raw) => groceries.parse(raw))
								.find((row) => row?.id === list.id);
							const row = current?.items.find((each) => each.id === item.id);
							if (!current || row?.photo !== uri) return false;
							await store.put(groceries.name, current.id, {
								...current,
								items: current.items.map((each) =>
									each.id === item.id ? Object.assign({}, each, { photo: url }) : each,
								),
							});
							return true;
						},
					},
				];
			}),
		);
	},
};

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
		myRecipes,
		(recipe) => recipe.image ?? null,
		(recipe, image) => ({ ...recipe, image }),
	),
	groceryPhotos,
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
