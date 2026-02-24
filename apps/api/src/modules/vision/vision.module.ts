import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Evidencia } from '../../entities/evidencia.entity';
import { VisionAIService } from '../../services/visionAI.service';
import { VisionProcessor, VISION_QUEUE } from './vision.processor';
import { VisionService } from './vision.service';
import { VisionController } from './vision.controller';
import { VisionCircuitBreakerService } from './vision-circuit-breaker.service';
import { VisionAlertsGateway } from './vision-alerts.gateway';
import { VisionQueueEventsListener } from './vision-queue-events.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Evidencia]),
    BullModule.registerQueue({ name: VISION_QUEUE }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'sigeo-dev-secret-change-in-prod',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [VisionController],
  providers: [
    VisionAIService,
    VisionService,
    VisionProcessor,
    VisionCircuitBreakerService,
    VisionAlertsGateway,
    VisionQueueEventsListener,
  ],
  exports: [VisionService],
})
export class VisionModule {}
