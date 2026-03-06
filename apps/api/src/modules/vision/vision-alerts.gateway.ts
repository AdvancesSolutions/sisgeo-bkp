import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

const SUPERVISOR_ROOM = 'supervisors';

export interface VisionCriticalAlert {
  evidenciaId: string;
  taskPhotoId: string;
  confianca: number;
  detalhes: string;
  imageUrl?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/vision-alerts',
})
export class VisionAlertsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: { handshake: { auth?: { token?: string }; query?: { token?: string } }; join: (room: string) => void; id: string }) {
    const token = client.handshake?.auth?.token ?? client.handshake?.query?.token;
    if (!token) {
      client.join('anonymous');
      return;
    }
    try {
      const payload = this.jwt.verify(token, {
        secret: this.config.get('JWT_SECRET') ?? 'sigeo-secret',
      }) as { role?: string };
      if (payload.role === 'ADMIN' || payload.role === 'SUPERVISOR') {
        client.join(SUPERVISOR_ROOM);
      }
    } catch {
      client.join('anonymous');
    }
  }

  handleDisconnect() {
    // cleanup opcional
  }

  /** Supervisor entra na sala para receber alertas */
  @SubscribeMessage('join-supervisors')
  joinSupervisors(client: { join: (room: string) => void }) {
    client.join(SUPERVISOR_ROOM);
  }

  /** Emite alerta crítico (score < 30%) para supervisores */
  emitCriticalAlert(alert: VisionCriticalAlert): void {
    this.server.to(SUPERVISOR_ROOM).emit('vision:critical-alert', alert);
  }

  /** Notifica administrador sobre circuit breaker (Ollama offline 5+ min) */
  emitCircuitOpen(): void {
    this.server.to(SUPERVISOR_ROOM).emit('vision:circuit-open', {
      message: 'Ollama indisponível há mais de 5 minutos. Fotos marcadas para revisão manual.',
      at: new Date().toISOString(),
    });
  }
}
