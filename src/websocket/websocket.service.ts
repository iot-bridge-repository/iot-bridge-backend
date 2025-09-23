import { Logger, Injectable, OnModuleInit } from '@nestjs/common';
import { WebSocketServer, WebSocket } from 'ws';

interface SubscribedClient {
  socket: WebSocket;
  topics: Set<string>;
}

interface DevicePinDataPayload {
  value: number;
  time: Date;
}

@Injectable()
export class WebsocketService implements OnModuleInit {
  private readonly logger = new Logger(WebsocketService.name);
  private wss: WebSocketServer;
  private readonly clients: Map<WebSocket, SubscribedClient> = new Map();

  // when the module is loaded
  onModuleInit() {
    // create the server
    this.wss = new WebSocketServer({ port: 3001 });

    // on connection
    this.wss.on('connection', (socket: WebSocket) => {
      this.logger.log('There is a client connected to websocket');
      this.clients.set(socket, { socket, topics: new Set() });

      // on message subscription
      socket.on('message', (message: string) => {
        try {
          const parsed = JSON.parse(message);
          this.logger.log(`There is a client subscribed to topics: ${parsed.topic}`);

          // subscription message check
          if (parsed.type === 'subscribe' && typeof parsed.topic === 'string') {
            const topicRegex = /^device-id\/[\w-]+\/pin\/[\w-]+$/;
            if (!topicRegex.test(parsed.topic)) {
              throw new Error(`Invalid topic format: ${parsed.topic}`);
            }

            // add the topic
            const client = this.clients.get(socket);
            client?.topics.add(parsed.topic);
          } else {
            throw new Error('Invalid subscription message, false parse message');
          }
        } catch (err) {
          this.logger.error(`Failed to parse message: ${err.message}`);
        }
      });

      // on close
      socket.on('close', () => {
        this.logger.log('There is a client disconnected from websocket');
        this.clients.delete(socket);
      });
    });

    this.logger.log('🌐 WebSocket server running on ws://localhost:3001');
  }

  // emit device pin data
  emitDevicePinData(deviceId: string, pin: string, data: DevicePinDataPayload) {
    const topic = `device-id/${deviceId}/pin/${pin}`;
    const payload = JSON.stringify({
      deviceId,
      pin,
      value: data.value, 
      time: data.time 
    });

    // send to clients while they have the topic
    this.clients.forEach(({ socket, topics }) => {
      if (topics.has(topic) && socket.readyState === socket.OPEN) {
        socket.send(payload);
      }
    });
  }
}
