import { Module } from '@nestjs/common';

import { AuthModule } from '@/modules/auth/auth.module';
import { FinanceModule } from '@/modules/finance/finance.module';
import { RoutinesModule } from '@/modules/routines/routines.module';
import { AiClient } from './ai.client';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiGatewayController } from './ai-gateway.controller';
import { AiGatewayRepository } from './ai-gateway.repository';
import { AiGatewayService } from './ai-gateway.service';

@Module({
	imports: [AuthModule, RoutinesModule, FinanceModule],
	controllers: [AiController, AiGatewayController],
	providers: [AiClient, AiService, AiGatewayRepository, AiGatewayService],
	exports: [AiService],
})
export class AiModule {}
