import {
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { JwtService } from '../auth/jwt.service';
import { maskDeviceId } from '../common/mask-device-id';

@WebSocketGateway({ namespace: '/telemetry', cors: { origin: '*' } })
export class TelemetryGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Namespace;

  constructor(private jwtService: JwtService) {}

  afterInit(server: Namespace) {
    server.use((socket: Socket, next) => {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('Authentication error'));
      const payload = this.jwtService.verify(token);
      if (!payload) return next(new Error('Authentication error'));
      (socket as Socket & { role: string }).role = (
        payload as { role: string }
      ).role;
      void socket.join((payload as { role: string }).role);
      next();
    });
  }

  emitLocation(data: {
    vehicleId: string;
    deviceId: string;
    lat: number;
    lng: number;
    speed: number | null;
    fuel_level: number | null;
    temperature: number | null;
    timestamp: Date;
  }) {
    this.server.to('admin').emit('vehicle:location', { ...data });
    this.server.to('user').emit('vehicle:location', {
      ...data,
      deviceId: maskDeviceId(data.deviceId, 'user'),
    });
  }
}
