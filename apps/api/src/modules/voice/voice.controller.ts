import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VoiceService, type VoiceIntent } from './voice.service';

@ApiTags('voice')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('voice')
export class VoiceController {
  constructor(private readonly service: VoiceService) {}

  @Post('intent')
  @ApiOperation({ summary: 'Identifica intenção a partir do texto (NLP)' })
  parseIntent(
    @Body() body: { text: string; checklistLabels?: string[] },
  ): Promise<VoiceIntent> {
    return this.service.parseIntent(body.text, {
      checklistLabels: body.checklistLabels,
    });
  }
}
