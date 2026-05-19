/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Disconnected:', client.id);
  }

  @SubscribeMessage('send-message')
  handleEvent(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log('Message:', data);

    // emit to everyone
    this.server.emit('message', {
      userId: client.id,
      message: data.message,
    });

    return {
      success: true,
    };
  }
}
