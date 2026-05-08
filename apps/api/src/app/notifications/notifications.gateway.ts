import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { BetterAuthService } from '../../common/better-auth/better-auth.service';

@WebSocketGateway({
  cors: {
    origin: (process.env.WEB_ORIGIN ?? 'http://localhost:4200')
      .split(',')
      .map((o) => o.trim()),
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly betterAuth: BetterAuthService) {}

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const headers = new Headers();
      const cookie = socket.handshake.headers.cookie;
      if (cookie) headers.set('cookie', cookie);

      const authHeader = socket.handshake.headers.authorization;
      if (authHeader) headers.set('authorization', authHeader);

      const token = socket.handshake.auth?.token as string | undefined;
      if (token && !authHeader) headers.set('authorization', `Bearer ${token}`);

      const fetchRequest = new Request(
        `${process.env.API_BASE_URL ?? 'http://localhost:3000'}/api/auth/get-session`,
        { headers },
      );

      const session = await this.betterAuth.getSession(fetchRequest);
      if (!session) {
        socket.disconnect(true);
        return;
      }

      socket.data.userId = session.user.id;
      await socket.join(`user:${session.user.id}`);
      this.logger.debug(`Socket connected: userId=${session.user.id}`);
    } catch (err) {
      this.logger.warn(`Socket auth failed: ${err}`);
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket): void {
    this.logger.debug(`Socket disconnected: socketId=${socket.id}`);
  }

  emit(userId: string, event: string, payload: unknown): void {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
}
