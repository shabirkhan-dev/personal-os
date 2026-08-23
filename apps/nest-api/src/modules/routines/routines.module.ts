import { Module } from '@nestjs/common';

import { AuthModule } from '@/modules/auth/auth.module';
import { RoutinesController } from './routines.controller';
import { RoutinesRepository } from './routines.repository';
import { RoutinesService } from './routines.service';

@Module({
	imports: [AuthModule],
	controllers: [RoutinesController],
	providers: [RoutinesRepository, RoutinesService],
})
export class RoutinesModule {}
