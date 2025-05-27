import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class WebsocketGateway {
  private readonly logger = new Logger(WebsocketGateway.name);
  @WebSocketServer()
  server: Server;

  emitDeviceData(deviceId: string, pin: string, data: object) {
    this.logger.log(`Emitting data for device ${deviceId} on pin ${pin}: ${JSON.stringify(data)}`);
    this.server.emit(`device-id/${deviceId}/pin/${pin}`, data);
  }
}
