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

const SUPERVISOR_ROOM = 'digital-twin-supervisors';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/digital-twin',
})
export class DigitalTwinGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: {
    handshake: { auth?: { token?: string }; query?: { token?: string } };
    join: (room: string) => void;
    id: string;
  }) {
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
    // cleanup
  }

  /** Emite atualização quando área muda (ex: check-out concluído) */
  emitAreaUpdated(payload: { locationId: string; areaId: string; status: string }): void {
    this.server.to(SUPERVISOR_ROOM).emit('digital-twin:area-updated', payload);
    this.server.to(`location:${payload.locationId}`).emit('digital-twin:area-updated', payload);
  }

  /** Cliente entra na sala de uma localização para receber updates */
  @SubscribeMessage('join-location')
  joinLocation(
    client: { join: (room: string) => void },
    payload: { locationId: string },
  ): void {
    if (payload?.locationId) {
      client.join(`location:${payload.locationId}`);
    }
  }
}
