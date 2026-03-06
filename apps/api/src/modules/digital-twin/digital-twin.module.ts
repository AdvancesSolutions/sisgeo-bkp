import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PlantaBaixa } from '../../entities/planta-baixa.entity';
import { AreaZone } from '../../entities/area-zone.entity';
import { Area } from '../../entities/area.entity';
import { Task } from '../../entities/task.entity';
import { Incident } from '../../entities/incident.entity';
import { OcorrenciaEmergencial } from '../../entities/ocorrencia-emergencial.entity';
import { ScoreDiario } from '../../entities/score-diario.entity';
import { Organization } from '../../entities/organization.entity';
import { Ativo } from '../../entities/ativo.entity';
import { UploadModule } from '../upload/upload.module';
import { DigitalTwinController } from './digital-twin.controller';
import { DigitalTwinService } from './digital-twin.service';
import { DigitalTwinGateway } from './digital-twin.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlantaBaixa,
      AreaZone,
      Area,
      Task,
      Incident,
      OcorrenciaEmergencial,
      ScoreDiario,
      Organization,
      Ativo,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') ?? 'sigeo-secret',
      }),
      inject: [ConfigService],
    }),
    UploadModule,
  ],
  controllers: [DigitalTwinController],
  providers: [DigitalTwinService, DigitalTwinGateway],
  exports: [DigitalTwinService, DigitalTwinGateway],
})
export class DigitalTwinModule {}
