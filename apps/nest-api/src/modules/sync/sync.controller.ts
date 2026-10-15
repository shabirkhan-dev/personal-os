import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import type { AccessTokenPayload } from '@/modules/auth/auth.types';
import { CurrentUser } from '@/modules/auth/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { SyncRequestDto } from './sync.dto';
import { SyncService } from './sync.service';

@ApiTags('Sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'sync', version: '1' })
export class SyncController {
	constructor(private readonly sync: SyncService) {}

	@Post()
	@HttpCode(HttpStatus.OK)
	@Throttle({ default: { limit: 60, ttl: 60_000 } })
	@ApiOperation({ summary: 'Push local changes and pull changes after a cursor' })
	run(@CurrentUser() user: AccessTokenPayload, @Body() body: SyncRequestDto) {
		return this.sync.sync(user.sub, body);
	}
}
