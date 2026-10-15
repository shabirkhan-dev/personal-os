import { Module } from '@nestjs/common';

import { AuthModule } from '@/modules/auth/auth.module';
import { SyncController } from './sync.controller';
import { SyncRepository } from './sync.repository';
import { SyncService } from './sync.service';

@Module({
	imports: [AuthModule],
	controllers: [SyncController],
	providers: [SyncRepository, SyncService],
})
export class SyncModule {}
