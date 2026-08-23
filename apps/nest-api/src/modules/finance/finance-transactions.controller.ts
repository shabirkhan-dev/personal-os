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
import {
	CreateTransactionDto,
	ListTransactionsQueryDto,
	UpdateTransactionDto,
} from './finance.dto';
import { FinanceService } from './finance.service';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'finance/transactions', version: '1' })
export class FinanceTransactionsController {
	constructor(private readonly finance: FinanceService) {}

	@Get()
	@ApiOperation({ summary: 'List transactions (bounded, filterable by type/category/month)' })
	list(@CurrentUser() user: AccessTokenPayload, @Query() query: ListTransactionsQueryDto) {
		return this.finance.listTransactions(user.sub, query);
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create a transaction (occurredOn defaults to today)' })
	create(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateTransactionDto) {
		return this.finance.createTransaction(user.sub, body);
	}

	@Patch(':id')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update a transaction' })
	update(
		@CurrentUser() user: AccessTokenPayload,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() body: UpdateTransactionDto,
	) {
		return this.finance.updateTransaction(user.sub, id, body);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Delete a transaction (hard delete — it is a ledger entry)' })
	remove(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
		return this.finance.deleteTransaction(user.sub, id);
	}
}
