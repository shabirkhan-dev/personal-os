import * as z from 'zod';

/** Reusable bounded offset pagination for list endpoints. */
export function makePaginationSchema(maxLimit = 200, defaultLimit = 100) {
	return z.object({
		limit: z.coerce.number().int().min(1).max(maxLimit).default(defaultLimit),
		offset: z.coerce.number().int().min(0).default(0),
	});
}

export type PaginationQuery = z.infer<ReturnType<typeof makePaginationSchema>>;
