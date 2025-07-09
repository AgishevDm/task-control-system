import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import { Inject, Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { TokenService } from 'src/auth/token.service';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  namespace: '/api/chat',
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    @Inject(TokenService) private readonly tokenService: TokenService,
    @Inject('REDIS_CHAT_CLIENT') private readonly redisClient: Redis,
    private readonly chatService: ChatService,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(ChatGateway.name);

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const payload = await this.tokenService.verifyAccessToken(token);
      client.data.userId = payload.sub;
      client.join(`chat:${client.handshake.query.chatId}`);
    } catch (e) {
      client.disconnect();
    }
  }

  private extractToken(client: Socket): string {
    return (
      client.handshake.auth.token ||
      client.handshake.headers.authorization?.split(' ')[1]
    );
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    client.data.redisSubscriber?.disconnect();
  }

  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatId: string,
  ) {
    try {
      this.logger.debug(`Join chat request: ${chatId} from ${client.data.userId}`);
      // Проверка, что пользователь участник чата
      const isMember = await this.chatService.isChatMember(client.data.userId, chatId);
      if (!isMember) {
        this.logger.warn(`Unauthorized chat access attempt: ${client.data.userId} -> ${chatId}`);
        throw new Error('Not a chat member');
      }

      client.join(`chat:${chatId}`);
      this.logger.log(`User ${client.data.userId} joined chat: ${chatId}`);
    } catch (e) {
      this.logger.error(`Join chat error: ${e.message}`);
      client.emit('error', { message: e.message });
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto & { tempId: string },
  ) {
    try {
      const message = await this.chatService.sendMessage({
        userId: client.data.userId,
        ...dto,
      });

      const responseMessage = {
        ...message,
        account: {
          id: client.data.userId,
          firstName: message.account.firstName,
          lastName: message.account.lastName,
          avatarUrl: message.account.avatarUrl,
        },
      };

      client.emit('chat:message', {
        ...responseMessage,
        id: dto.tempId,
      });
      client.to(`chat:${dto.chatId}`).emit('chat:message', responseMessage);
      this.logger.log(`Message attempt from ${client.data.userId}`);
      return { status: 'success' };
    } catch (e) {
      return { status: 'error', message: e.message };
    }
  }
}
