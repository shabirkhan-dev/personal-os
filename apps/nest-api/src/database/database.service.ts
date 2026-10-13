import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';

import { AppConfigService } from '@/config/app-config.service';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class DatabaseService implements OnModuleDestroy {
	readonly db: Database;
	private readonly client: Sql;

	constructor(config: AppConfigService) {
		this.client = postgres(config.databaseUrl, {
			max: config.databasePoolMax,
			prepare: false,
			ssl: config.databaseSsl ? 'require' : false,
		});
		this.db = drizzle(this.client, { schema });
	}

	async onModuleDestroy(): Promise<void> {
		await this.client.end({ timeout: 5 });
	}
}
