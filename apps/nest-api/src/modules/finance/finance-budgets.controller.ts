import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import type { AccessTokenPayload } from '@/modules/auth/auth.types';
import { CurrentUser } from '@/modules/auth/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { financeMonthSchema, UpsertBudgetsDto } from './finance.dto';
import { FinanceService } from './finance.service';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'finance', version: '1' })
export class FinanceBudgetsController {
	constructor(private readonly finance: FinanceService) {}

	@Get('summary/:month')
	@ApiOperation({
		summary: 'Month summary: totals, per-category spend, budget vs actual',
	})
	getSummary(
		@CurrentUser() user: AccessTokenPayload,
		@Param('month', new ZodValidationPipe(financeMonthSchema)) month: string,
	) {
		return this.finance.getSummary(user.sub, month);
	}

	@Put('budgets/:month')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Replace the whole month budget set (categories are lower-cased)',
	})
	setBudgets(
		@CurrentUser() user: AccessTokenPayload,
		@Param('month', new ZodValidationPipe(financeMonthSchema)) month: string,
		@Body() body: UpsertBudgetsDto,
	) {
		return this.finance.setBudgets(user.sub, month, body);
	}

	@Get('budgets/:month')
	@ApiOperation({ summary: 'List budgets for a month' })
	getBudgets(
		@CurrentUser() user: AccessTokenPayload,
		@Param('month', new ZodValidationPipe(financeMonthSchema)) month: string,
	) {
		return this.finance.getBudgets(user.sub, month);
	}
}
