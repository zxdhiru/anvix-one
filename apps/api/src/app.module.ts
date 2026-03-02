import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlatformModule } from './platform/platform.module';
import { SchoolModule } from './school/school.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CommonModule,
    PlatformModule,
    SchoolModule,
  ],
})
export class AppModule {}
