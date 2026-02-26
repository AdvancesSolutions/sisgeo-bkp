import { Injectable, UnauthorizedException, BadRequestException, ServiceUnavailableException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { MailService } from '../../common/mail.service';

const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'sigeo-refresh-dev-change-in-prod';
const RESET_EXPIRES_MS = 60 * 60 * 1000; // 1 hora
const APP_URL = process.env.APP_URL ?? process.env.CORS_ORIGIN ?? 'http://localhost:5173';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { id: string; name: string; email: string; role: string; employeeId?: string | null };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const user = await this.userRepo.findOne({ where: { email } });
      if (!user) {
        throw new UnauthorizedException('Credenciais inválidas');
      }
      if (!user.passwordHash?.length) {
        this.logger.warn(`Login: user ${user.email} sem passwordHash`);
        throw new UnauthorizedException('Credenciais inválidas');
      }
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        throw new UnauthorizedException('Credenciais inválidas');
      }
      return this.issueTokens(user);
    } catch (e) {
      if (e instanceof UnauthorizedException || e instanceof ServiceUnavailableException) throw e;
      const err = e as Error & { cause?: Error };
      const msg = err?.message ?? String(e);
      const causeMsg = err?.cause?.message ?? '';
      const full = `${msg} ${causeMsg}`.toLowerCase();
      this.logger.error(`Login error: ${msg}`, err?.stack);
      const isDbOrConn =
        full.includes('password authentication') ||
        full.includes('econnrefused') ||
        full.includes('connection refused') ||
        full.includes('connect econnrefused') ||
        full.includes('timeout') ||
        full.includes('connection') && full.includes('refused') ||
        (full.includes('relation') && full.includes('does not exist'));
      const isJwt = full.includes('secret') || full.includes('jwt') || full.includes('sign');
      if (isDbOrConn || isJwt) {
        throw new ServiceUnavailableException('Serviço temporariamente indisponível. Tente novamente em instantes.');
      }
      throw e;
    }
  }

  async getMe(userId: string): Promise<{ id: string; name: string; email: string; role: string; employeeId?: string | null }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    return { id: user.id, name: user.name, email: user.email, role: user.role, employeeId: user.employeeId };
  }

  async refresh(refreshToken: string): Promise<LoginResult> {
    try {
      const payload = this.jwt.verify(refreshToken, { secret: REFRESH_SECRET }) as {
        sub: string;
        email: string;
      };
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('Token inválido');
      }
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return { message: 'Se o e-mail estiver cadastrado, você receberá o link de redefinição em breve.' };
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + RESET_EXPIRES_MS);
    await this.userRepo.update(user.id, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    });
    const resetLink = `${APP_URL.replace(/\/$/, '')}/reset-password?token=${token}`;
    await this.mail.sendPasswordResetEmail(user.email, resetLink);
    return { message: 'Se o e-mail estiver cadastrado, você receberá o link de redefinição em breve.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({
      where: { passwordResetToken: token },
    });
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Token inválido ou expirado. Solicite uma nova redefinição.');
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(user.id, {
      passwordHash: hash,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
    return { message: 'Senha alterada com sucesso. Faça login com a nova senha.' };
  }

  async seed(): Promise<{ message: string; count: number; users: any[] }> {
    const seedData = [
      {
        id: '0cde5dbd-7e3a-47c6-a4ec-f14fceb1fa7b',
        name: 'Admin Super',
        email: 'admin@empresa.com',
        role: 'SUPER_ADMIN',
        password: 'admin123',
      },
      {
        id: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
        name: 'Super Admin Teste',
        email: 'super@empresa.com',
        role: 'SUPER_ADMIN',
        password: 'super123',
      },
      {
        id: '6a411dd7-e16e-4a0e-844e-151e30992385',
        name: 'João Silva',
        email: 'joao.ti@empresa.com',
        role: 'GESTOR',
        password: 'gestor123',
      },
      {
        id: 'b681c766-abaf-439f-8fb4-3c515decf6dd',
        name: 'Maria Santos',
        email: 'maria.vendas@empresa.com',
        role: 'GESTOR',
        password: 'gestor123',
      },
      {
        id: '24aabcd2-bbe6-4501-8a61-b7113c9c83ae',
        name: 'Carlos Funcionário',
        email: 'carlos.funcionario@empresa.com',
        role: 'FUNCIONARIO',
        password: 'senha123',
      },
    ];

    const inserted = [];
    for (const data of seedData) {
      const exists = await this.userRepo.findOne({ where: { email: data.email } });
      if (!exists) {
        const hash = await bcrypt.hash(data.password, 10);
        const user = this.userRepo.create({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          passwordHash: hash,
        });
        await this.userRepo.save(user);
        inserted.push({ email: data.email, role: data.role });
      } else if (exists.role !== data.role) {
        // Atualiza o role se for diferente (migração de strings legíveis para constantes)
        exists.role = data.role;
        await this.userRepo.save(exists);
        inserted.push({ email: data.email, role: data.role, updated: true });
      }
    }

    const count = await this.userRepo.count();
    return {
      message: 'Database seeded successfully',
      count,
      users: inserted,
    };
  }

  private issueTokens(user: User): LoginResult {
    console.log(`[AuthService] Issuing tokens for user: ${user.email}`);
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(
      { sub: user.id, email: user.email },
      { secret: REFRESH_SECRET, expiresIn: REFRESH_EXPIRES },
    );
    const expiresIn = 15 * 60;
    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, employeeId: user.employeeId },
    };
  }
}
