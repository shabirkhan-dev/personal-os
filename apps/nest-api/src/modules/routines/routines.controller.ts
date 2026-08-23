import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AccessTokenPayload } from '@/modules/auth/auth.types';
import { CurrentUser } from '@/modules/auth/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { CreateRoutineDto, ListRoutinesQueryDto, UpdateRoutineDto } from './routines.dto';
import { RoutinesService } from './routines.service';

@ApiTags('Routines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'routines', version: '1' })
export class RoutinesController {
	constructor(private readonly routines: RoutinesService) {}

	@Get('today')
	@ApiOperation({ summary: "Get today's scheduled routines with completion state" })
	getToday(@CurrentUser() user: AccessTokenPayload) {
		return this.routines.getToday(user.sub);
	}

	@Get()
	@ApiOperation({ summary: 'List active routines (bounded by limit/offset)' })
	list(@CurrentUser() user: AccessTokenPayload, @Query() query: ListRoutinesQueryDto) {
		return this.routines.list(user.sub, query);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a single routine' })
	get(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
		return this.routines.get(user.sub, id);
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create a routine with items' })
	create(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateRoutineDto) {
		return this.routines.create(user.sub, body);
	}

	@Patch(':id')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update a routine (items are replaced when provided)' })
	update(
		@CurrentUser() user: AccessTokenPayload,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() body: UpdateRoutineDto,
	) {
		return this.routines.update(user.sub, id, body);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Archive a routine (soft delete)' })
	archive(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
		return this.routines.archive(user.sub, id);
	}

	@Post(':routineId/items/:itemId/toggle')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Toggle an item completion for today' })
	toggleItem(
		@CurrentUser() user: AccessTokenPayload,
		@Param('routineId', ParseUUIDPipe) routineId: string,
		@Param('itemId', ParseUUIDPipe) itemId: string,
	) {
		return this.routines.toggleItem(user.sub, routineId, itemId);
	}
}
