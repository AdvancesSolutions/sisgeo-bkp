import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CleaningType } from '../../entities/cleaning-type.entity';
import { CleaningTypesController } from './cleaning-types.controller';
import { CleaningTypesService } from './cleaning-types.service';

@Module({
  imports: [TypeOrmModule.forFeature([CleaningType])],
  controllers: [CleaningTypesController],
  providers: [CleaningTypesService],
  exports: [CleaningTypesService],
})
export class CleaningTypesModule {}
