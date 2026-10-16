import { useMemo } from "react";
import type { Piece } from "../lib/fashion-model";
import { useFashionToday } from "./use-fashion-today";

export type FashionDay = {
	/** Today's look (worn, or the first pick), with a piece to show. */
	look: { name: string; worn: boolean; piece: Piece | null } | null;
	/** "12° now, 18° at noon". */
	weather: string | null;
};

/** Today's look for the morning brief. */
export function useFashionDay(): FashionDay {
	const { data, looks, worn, weather, context } = useFashionToday();
	return useMemo(() => {
		const byId = new Map(data.pieces.map((piece) => [piece.id, piece]));
		const wornPiece = worn
			? (worn.pieceIds
					.map((id) => byId.get(id))
					.find((piece) => piece?.category === "layer" || piece?.category === "top") ?? null)
			: null;
		const first = looks[0];
		const look = worn
			? { name: worn.look || "Today's look", worn: true, piece: wornPiece }
			: first
				? { name: first.name, worn: false, piece: first.clothes[0] ?? null }
				: null;
		const now = weather.forecast ? Math.round(weather.forecast.now.temp) : null;
		const noon = context.weather?.noon ?? null;
		return {
			look,
			weather:
				now === null
					? null
					: noon === null
						? `${now}° now`
						: `${now}° now, ${Math.round(noon)}° at noon`,
		};
	}, [data.pieces, looks, worn, weather.forecast, context.weather]);
}
