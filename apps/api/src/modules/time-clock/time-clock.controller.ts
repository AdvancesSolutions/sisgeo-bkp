import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TimeClockService } from './time-clock.service';
import { UploadService } from '../upload/upload.service';
import { timeClockSchema } from '@sigeo/shared';
import type { TimeClockInput } from '@sigeo/shared';

const storage = memoryStorage();
const limit = 5 * 1024 * 1024; // 5MB

const parseBody = (body: unknown, type: 'CHECKIN' | 'CHECKOUT') => {
  const b = body as Record<string, unknown>;
  const lat = typeof b.lat === 'string' ? parseFloat(b.lat) : b.lat;
  const lng = typeof b.lng === 'string' ? parseFloat(b.lng) : b.lng;
  return timeClockSchema.parse({ ...b, type, lat, lng }) as TimeClockInput;
};

@ApiTags('time-clock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('time-clock')
export class TimeClockController {
  constructor(
    private readonly service: TimeClockService,
    private readonly upload: UploadService,
  ) {}

  @Post('checkin')
  @ApiOperation({ summary: 'Check-in com GPS e foto obrigatória' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['employeeId', 'lat', 'lng', 'file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        employeeId: { type: 'string', format: 'uuid' },
        lat: { type: 'number' },
        lng: { type: 'number' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: limit },
      fileFilter: (_, file, cb) => {
        const ok = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype);
        cb(null, ok);
      },
    }),
  )
  async checkin(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: unknown,
    @CurrentUser() user: { sub: string; role: string; employeeId?: string | null },
  ) {
    if (!file) throw new BadRequestException('Foto é obrigatória no check-in');
    const employeeId = this.resolveEmployeeId(body, user);
    const d = parseBody(body, 'CHECKIN');
    const photo = await this.upload.save(file, 'timeclock', undefined, {
      taskId: employeeId,
      type: 'BEFORE',
    });
    return this.service.register(employeeId, { ...d, type: 'CHECKIN' }, photo);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Check-out com GPS e foto obrigatória' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['employeeId', 'lat', 'lng', 'file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        employeeId: { type: 'string', format: 'uuid' },
        lat: { type: 'number' },
        lng: { type: 'number' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: limit },
      fileFilter: (_, file, cb) => {
        const ok = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype);
        cb(null, ok);
      },
    }),
  )
  async checkout(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: unknown,
    @CurrentUser() user: { sub: string; role: string; employeeId?: string | null },
  ) {
    if (!file) throw new BadRequestException('Foto é obrigatória no check-out');
    const employeeId = this.resolveEmployeeId(body, user);
    const d = parseBody(body, 'CHECKOUT');
    const photo = await this.upload.save(file, 'timeclock', undefined, {
      taskId: employeeId,
      type: 'AFTER',
    });
    return this.service.register(employeeId, { ...d, type: 'CHECKOUT' }, photo);
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Listar por funcionário' })
  findByEmployee(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findByEmployee(employeeId, limit ? parseInt(limit, 10) : 50);
  }

  private resolveEmployeeId(
    body: unknown,
    user: { role: string; employeeId?: string | null },
  ): string {
    const b = body as { employeeId?: string };
    if (user.role === 'ADMIN' && b.employeeId) return b.employeeId;
    if (user.employeeId) return user.employeeId;
    if (b.employeeId) return b.employeeId;
    throw new BadRequestException('employeeId é obrigatório');
  }

}
