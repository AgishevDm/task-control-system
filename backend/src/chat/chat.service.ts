import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Chat } from '@prisma/client';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@Injectable()
// @WebSocketGateway()
export class ChatService {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async createChat(userId: string, dto: CreateChatDto) {
    return this.prisma.chat.create({
      data: {
        title: dto.title,
        description: dto.description,
        account: userId,
        members: {
          create: [
            { account: userId },
            ...dto.memberIds.map((id) => ({
              account: id,
            })),
          ],
        },
      },
      include: {
        members: {
          select: {
            accountRef: {
              select: {
                primarykey: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async createGroupChat(userId: string, dto: CreateChatDto) {
    const uniqueMemberIds = [
      ...new Set(dto.memberIds.filter((id) => id !== userId)),
    ];

    return this.prisma.chat.create({
      data: {
        title: dto.title,
        description: dto.description,
        isPrivate: false,
        account: userId,
        members: {
          create: [
            { account: userId }, // создатель
            ...uniqueMemberIds.map((id) => ({
              // участники
              account: id,
            })),
          ],
        },
      },
      include: {
        members: {
          select: {
            accountRef: {
              select: {
                primarykey: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async sendMessage({ userId, ...dto }: { userId: string } & SendMessageDto) {
    console.log(`Message attempt from ${userId} in chat ${dto.chatId}`);
    if (!dto.chatId || !userId) {
      throw new BadRequestException('Invalid message data');
    }

    console.debug(`Checking membership for ${userId} in ${dto.chatId}`);
    const isMember = await this.isChatMember(userId, dto.chatId);
    if (!isMember) {
      console.warn(`Unauthorized message attempt from ${userId}`);
      throw new ForbiddenException('Not a chat member');
    }

    const messageData: any = {
      content: dto.content || '',
      chat: { connect: { primarykey: dto.chatId } },
      accountRef: {
        connect: { primarykey: userId },
      },
    };

    if (dto.attachments?.length) {
      messageData.attachments = {
        create: dto.attachments.map((att) => ({
          file: att.fileId,
          fileName: att.fileName,
          fileSize: att.fileSize,
          fileType: att.fileType,
        })),
      };
    }

    console.log(`Creating message in chat ${dto.chatId}`);
    const message = await this.prisma.chatMessage.create({
      data: messageData,
      include: {
        accountRef: {
          select: {
            primarykey: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        attachments: {
          include: {
            file: true,
          },
        },
      },
    });

    // отправляем по WebSocket
    this.server?.to(`chat:${dto.chatId}`).emit('chat:message', {
      ...message,
      createdAt: new Date().toISOString(),
    });

    return {
      ...message,
      id: message.primarykey,
      account: message.accountRef, // Преобразуем accountRef в account
      accountRef: undefined,
    };
  }

  async getChatMessages(chatId: string, page = 1, limit = 50) {
    const result = await this.prisma.chatMessage.findMany({
      where: { chatId },
      include: {
        accountRef: {
          select: {
            primarykey: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        attachments: {
          include: {
            file: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return result.map((item) => ({
      ...item,
      account: {
        id: item.accountRef.primarykey,
        firstName: item.accountRef.firstName,
        lastName: item.accountRef.lastName,
        avatarUrl: item.accountRef.avatarUrl,
      },
      accountRef: undefined,
    }));
  }

  async uploadChatFile(
    userId: string,
    file: Express.Multer.File,
    chatId: string,
  ) {
    return this.s3Service.uploadFile(file, `chats/${chatId}`, userId);
  }

  // chat.service.ts

  async getOrCreatePrivateChat(
    userId: string,
    recipientId: string,
  ): Promise<Chat> {
    // Проверка существования пользователей
    const [user, recipient] = await Promise.all([
      this.prisma.account.findUnique({ where: { primarykey: userId } }),
      this.prisma.account.findUnique({ where: { primarykey: recipientId } }),
    ]);

    if (!user || !recipient) {
      throw new NotFoundException('One or both users not found');
    }

    // Поиск существующего чата
    const existingChat = await this.prisma.chat.findFirst({
      where: {
        AND: [
          { isPrivate: true },
          { members: { some: { account: userId } } },
          { members: { some: { account: recipientId } } },
        ],
      },
    });

    if (existingChat) return existingChat;

    // Создание нового чата с обработкой ошибок уникальности
    try {
      return await this.prisma.chat.create({
        data: {
          title: `Private Chat`,
          isPrivate: true,
          account: userId,
          members: {
            create: [{ account: userId }, { account: recipientId }],
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        // Если чат создался параллельно, находим его
        const chat = await this.prisma.chat.findFirst({
          where: {
            AND: [
              { isPrivate: true },
              { members: { some: { account: userId } } },
              { members: { some: { account: recipientId } } },
            ],
          },
        });
        if (chat) return chat;
      }
      throw error;
    }
  }

  async getUserChats(userId: string) {
    const result = await this.prisma.chat.findMany({
      where: {
        members: { some: { account: userId } },
      },
      include: {
        members: {
          include: {
            accountRef: {
              select: {
                primarykey: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          include: {
            accountRef: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return result.map((item) => ({
      ...item,
      members: item.members.map((member) => ({
        ...member,
        accountRef: {
          ...member.accountRef,
          id: member.accountRef.primarykey,
        },
      })),
    }));
  }

  async addMembersToGroup(chatId: string, userIds: string[]) {
    return this.prisma.chat.update({
      where: { primarykey: chatId },
      data: {
        members: {
          create: userIds.map((id) => ({
            account: id,
          })),
        },
      },
    });
  }

  async isChatMember(userId: string, chatId: string): Promise<boolean> {
    const member = await this.prisma.chatMember.findFirst({
      where: {
        chatId,
        account: userId,
      },
    });
    return !!member;
  }

  async removeMemberFromGroup(
    chatId: string,
    userId: string,
    requesterId: string,
  ): Promise<void> {
    // Проверяем, что запрашивающий является админом чата
    const chat = await this.prisma.chat.findUnique({
      where: { primarykey: chatId },
      select: { account: true },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.account !== requesterId) {
      throw new ForbiddenException('Only chat admin can remove members');
    }

    if (userId === requesterId) {
      throw new BadRequestException('Admin cannot remove themselves');
    }

    await this.prisma.chatMember.deleteMany({
      where: {
        chatId,
        account: userId,
      },
    });

    // Отправляем уведомление через WebSocket
    this.server
      ?.to(`chat:${chatId}`)
      .emit('chat:member_removed', { chatId, userId });
  }

  async deleteChat(chatId: string, requesterId: string): Promise<void> {
    // Проверяем, что запрашивающий является админом чата
    const chat = await this.prisma.chat.findUnique({
      where: { primarykey: chatId },
      select: { account: true, isPrivate: true }
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.account !== requesterId) {
      throw new ForbiddenException('Only chat creator can delete the chat');
    }

    // Удаляем все связанные данные
    await this.prisma.$transaction([
      this.prisma.chatMessage.deleteMany({ where: { chatId } }),
      this.prisma.chatMember.deleteMany({ where: { chatId } }),
      this.prisma.chat.delete({ where: { primarykey: chatId } })
    ]);

    // Отправляем уведомление через WebSocket
    this.server?.to(`chat:${chatId}`).emit('chat:deleted', { chatId });
    this.server?.in(`chat:${chatId}`).disconnectSockets(true);
  }
}
