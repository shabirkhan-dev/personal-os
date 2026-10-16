import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useFaithPlace } from "@/modules/faith";
import type { UvDay } from "../lib/uv";
import { cachedUv, fetchUv } from "../services/uv-service";
import { useCare } from "./use-care";

/** Today's UV for where the person is (Care's place, else the one Faith found); cached offline. */
export function useUv(): { uv: UvDay | null; hasPlace: boolean } {
	const { settings } = useCare();
	const faithPlace = useFaithPlace();
	const place = settings.place ?? faithPlace;
	const [cached, setCached] = useState<UvDay | null>(null);

	useEffect(() => {
		let alive = true;
		cachedUv()
			.then((value) => {
				if (alive) setCached(value);
			})
			.catch((error: unknown) => console.warn("[care] cached UV failed", error));
		return () => {
			alive = false;
		};
	}, []);

	const query = useQuery({
		queryKey: ["uv", place?.latitude.toFixed(2), place?.longitude.toFixed(2)],
		queryFn: () => (place ? fetchUv(place) : Promise.resolve(null)),
		enabled: place !== null,
		staleTime: 60 * 60_000,
		retry: 1,
	});
	return { uv: query.data ?? cached, hasPlace: place !== null };
}
