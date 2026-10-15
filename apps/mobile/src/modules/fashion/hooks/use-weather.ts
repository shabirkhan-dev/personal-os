import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Place } from "@/lib/location/current-place";
import { useFaithPlace } from "@/modules/faith";
import type { Forecast } from "../lib/weather";
import { cachedForecast, fetchForecast } from "../services/weather-service";
import { useFashion } from "./use-fashion";

/**
 * The forecast for where the person is (Fashion's own place, else the one Faith found). Refreshes
 * every half hour; offline it shows the last forecast saved on the phone.
 */
export function useWeather(): {
	place: Place | null;
	forecast: Forecast | null;
	loading: boolean;
	stale: boolean;
} {
	const { settings } = useFashion();
	const faithPlace = useFaithPlace();
	const place = settings.place ?? faithPlace;
	const [cached, setCached] = useState<Forecast | null>(null);

	useEffect(() => {
		let alive = true;
		cachedForecast()
			.then((value) => {
				if (alive) setCached(value);
			})
			.catch((error: unknown) => console.warn("[fashion] cached forecast failed", error));
		return () => {
			alive = false;
		};
	}, []);

	const query = useQuery({
		queryKey: ["weather", place?.latitude.toFixed(2), place?.longitude.toFixed(2)],
		queryFn: () => (place ? fetchForecast(place) : Promise.resolve(null)),
		enabled: place !== null,
		staleTime: 30 * 60_000,
		refetchInterval: 30 * 60_000,
		retry: 1,
	});

	const forecast = query.data ?? cached;
	return {
		place,
		forecast,
		loading: place !== null && query.isPending && !cached,
		stale: !query.data && cached !== null,
	};
}
