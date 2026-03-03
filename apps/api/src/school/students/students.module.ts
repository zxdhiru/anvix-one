import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { DatabaseModule } from '../../common/database/database.module';
import { FeesModule } from '../fees/fees.module';

@Module({
  imports: [DatabaseModule, FeesModule],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
