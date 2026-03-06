import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('usuarios')
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN', 'GESTOR', 'SUPERVISOR')
  @ApiOperation({ summary: 'Listar usuários' })
  async list() {
    const data = await this.users.findAll();
    return { data };
  }

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN', 'GESTOR', 'SUPERVISOR')
  @ApiOperation({ summary: 'Criar usuário' })
  async create(@Body() body: any) {
    return this.users.create(body);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'GESTOR', 'SUPERVISOR')
  @ApiOperation({ summary: 'Atualizar usuário' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.users.update(id, body);
  }

  @Post(':id/alterar-senha')
  @Roles('ADMIN', 'SUPER_ADMIN', 'GESTOR', 'SUPERVISOR')
  @ApiOperation({ summary: 'Alterar senha de usuário' })
  async changePassword(
    @Param('id') id: string,
    @Body() body: { senhaNova: string },
  ) {
    await this.users.updatePassword(id, body.senhaNova);
    return { message: 'Senha alterada com sucesso' };
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Deletar usuário' })
  async remove(@Param('id') id: string) {
    await this.users.remove(id);
    return { message: 'Usuário removido' };
  }
}
