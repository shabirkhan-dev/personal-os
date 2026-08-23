import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

import { AppConfigService } from '@/config/app-config.service';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defense for cookie-authenticated browser requests.
 *
 * A request is only at risk when the ambient refresh cookie would be attached
 * automatically by the browser. Native clients authenticate via an explicit
 * bearer token or a refresh token in the body, so they never carry the cookie
 * and are allowed through. Any request that *does* carry the refresh cookie
 * must also present an `Origin` header matching the configured allowlist;
 * missing, `null`, or mismatched origins are rejected.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
	constructor(private readonly config: AppConfigService) {}

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<Request>();
		if (safeMethods.has(request.method)) {
			return true;
		}

		const cookie = request.cookies?.[this.config.refreshCookieName];
		const cookieAuthenticated = typeof cookie === 'string' && cookie.length > 0;
		if (!cookieAuthenticated) {
			return true;
		}

		const origin = request.headers.origin;
		if (
			typeof origin === 'string' &&
			origin !== 'null' &&
			this.config.corsOrigins.includes(origin)
		) {
			return true;
		}

		throw new ForbiddenException({
			code: 'AUTH_CSRF_REJECTED',
			message: 'Request origin could not be verified',
		});
	}
}
