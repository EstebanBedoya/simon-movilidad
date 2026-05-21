import {
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { JwtService } from '../auth/jwt.service';

@WebSocketGateway({ namespace: '/alerts', cors: { origin: '*' } })
export class AlertsGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Namespace;

  constructor(private jwtService: JwtService) {}

  afterInit(server: Namespace) {
    server.use((socket: Socket, next) => {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('Authentication error'));
      const payload = this.jwtService.verify(token);
      if (!payload) return next(new Error('Authentication error'));
      if ((payload as { role: string }).role !== 'admin')
        return next(new Error('Forbidden'));
      next();
    });
  }

  emitAlert(data: object) {
    this.server.emit('alert:created', data);
  }
}
