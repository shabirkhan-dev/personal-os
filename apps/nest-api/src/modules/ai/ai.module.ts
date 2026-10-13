import { Module } from '@nestjs/common';

import { AuthModule } from '@/modules/auth/auth.module';
import { AiClient } from './ai.client';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
	imports: [AuthModule],
	controllers: [AiController],
	providers: [AiClient, AiService],
	exports: [AiService],
})
export class AiModule {}
