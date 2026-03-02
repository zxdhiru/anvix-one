import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { TenantDatabaseService } from './tenant-database.service';

@Global()
@Module({
  providers: [
    {
      provide: DatabaseService,
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.getOrThrow<string>('DATABASE_URL');
        return new DatabaseService(databaseUrl);
      },
      inject: [ConfigService],
    },
    TenantDatabaseService,
  ],
  exports: [DatabaseService, TenantDatabaseService],
})
export class DatabaseModule {}
