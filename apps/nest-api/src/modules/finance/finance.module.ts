import { Module } from '@nestjs/common';

import { AuthModule } from '@/modules/auth/auth.module';
import { FinanceRepository } from './finance.repository';
import { FinanceService } from './finance.service';
import { FinanceBudgetsController } from './finance-budgets.controller';
import { FinanceTransactionsController } from './finance-transactions.controller';

@Module({
	imports: [AuthModule],
	controllers: [FinanceTransactionsController, FinanceBudgetsController],
	providers: [FinanceRepository, FinanceService],
})
export class FinanceModule {}
