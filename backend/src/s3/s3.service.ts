import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { PrismaService } from '../prisma/prisma.service';
import { FileHierarchyResponseDto } from './dto/FileHierarchyResponse.dto';
import { CreateFolderDto } from './dto/createfolder.dto';
import { SharePermission } from '@prisma/client';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(
    private readonly configService: ConfigService,
    public readonly prisma: PrismaService,
  ) {
    const endpoint = this.getRequiredConfig('AWS_ENDPOINT');
    const region = this.getRequiredConfig('AWS_REGION');
    const accessKeyId = this.getRequiredConfig('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.getRequiredConfig('AWS_SECRET_ACCESS_KEY');
    this.bucketName = this.getRequiredConfig('AWS_BUCKET_NAME');

    this.s3 = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) throw new Error(`Missing required config: ${key}`);
    return value;
  }

  private generateUniqueFileName(originalName: string): string {
    const separator = '---';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomString}-${originalName}`;
  }

  async generatePresignedUrl(key: string, expiresIn = 604800): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucketName, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async uploadAndSaveFile(
    file: Express.Multer.File,
    folder: string,
    userId?: string,
    fileType?: string,
  ) {
    if (!userId) throw new Error('User ID is required for file upload');

    const uniqueFileName = this.generateUniqueFileName(file.originalname);
    const key = `badgi/${folder}/${uniqueFileName}`;

    console.log('sdf  d  - ', uniqueFileName)

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const dbFile = await this.prisma.file.create({
      data: {
        filename: file.originalname,
        path: await this.generatePresignedUrl(key),
        size: file.size,
        mimeType: fileType || file.mimetype,
        uploadedById: userId,
        isDeleted: false,
      },
    });

    return {
      ...dbFile,
      url: await this.generatePresignedUrl(key),
      s3Key: key,
    };
  }

  async uploadFile(
    file: Express.Multer.File,
    subfolder: string,
    accountId?: string,
    fileType?: string,
  ): Promise<{ primarykey: string; url: string; key: string }> {
    const result = await this.uploadAndSaveFile(
      file,
      subfolder,
      accountId,
      fileType,
    );

    if (accountId && subfolder === 'avatars') {
      await this.updateUserAvatar(accountId, result.s3Key);
    }

    return {
      primarykey: result.primarykey,
      url: result.url,
      key: result.s3Key,
    };
  }

  async deleteFileWithDbRecord(key: string) {
    const fileRecord = await this.prisma.file.findFirst({
      where: { path: key },
      include: {
        TaskAttachment: true,
        CommentAttachment: true,
        ChatAttachment: true,
      },
    });

    if (fileRecord) {
      await this.prisma.$transaction([
        ...fileRecord.TaskAttachment.map((a) =>
          this.prisma.taskAttachment.delete({
            where: { primarykey: a.primarykey },
          }),
        ),
        ...fileRecord.CommentAttachment.map((a) =>
          this.prisma.commentAttachment.delete({
            where: { primarykey: a.primarykey },
          }),
        ),
        ...fileRecord.ChatAttachment.map((a) =>
          this.prisma.chatAttachment.delete({
            where: { primarykey: a.primarykey },
          }),
        ),
        this.prisma.file.delete({
          where: { primarykey: fileRecord.primarykey },
        }),
      ]);
    }

    await this.deleteFile(key);
  }

  async getUserFiles(userId: string) {
    const files = await this.prisma.file.findMany({
      where: { uploadedById: userId, isDeleted: false },
      orderBy: { uploadedAt: 'desc' },
    });

    return Promise.all(
      files.map(async (file) => ({
        ...file,
        rl: await this.generatePresignedUrl(file.path),
      })),
    );
  }

  async updateUserAvatar(userId: string, key: string) {
    const url = await this.generatePresignedUrl(key);

    await this.prisma.account.update({
      where: { primarykey: userId },
      data: { avatarUrl: url },
    });

    return url;
  }

  async getFileStream(key: string): Promise<Readable | undefined> {
    try {
      const response = await this.s3.send(
        new GetObjectCommand({ Bucket: this.bucketName, Key: key })
      );
      return response.Body as Readable;
    } catch (error) {
      return undefined;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }),
      );
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({ Bucket: this.bucketName, Key: key }),
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async getFileUrl(key: string, expiresIn = 3600): Promise<string> {
    return this.generatePresignedUrl(key, expiresIn);
  }

  private async generateFolderPath(
    userId: string,
    parentId: string | undefined,
    folderName: string,
  ): Promise<string> {
    let basePath = `users/${userId}`;

    if (parentId) {
      const parent = await this.prisma.fileHierarchy.findUnique({
        where: { primarykey: parentId },
      });

      if (!parent) {
        throw new Error(`Parent folder with ID ${parentId} not found`);
      }

      basePath = parent.s3Key;
    }

    return `${basePath}/${folderName}`;
  }

  async createFolder(
    userId: string,
    dto: CreateFolderDto,
  ): Promise<FileHierarchyResponseDto> {
    try {
      let finalName = dto.name;
      let counter = 1;

      while (true) {
        const existingFolder = await this.prisma.fileHierarchy.findFirst({
          where: {
            parentId: dto.parentId,
            name: finalName,
            type: 'FOLDER',
            ownerId: userId,
          },
        });

        if (!existingFolder) break;

        // Извлекаем существующий номер из имени (если есть)
        const match = finalName.match(/^(.*?)\s*\((\d+)\)$/);
        if (match) {
          counter = parseInt(match[2]) + 1;
          finalName = `${match[1]} (${counter})`;
        } else {
          finalName = `${dto.name} (${counter++})`;
        }
      }

      const s3Key = await this.generateFolderPath(
        userId,
        dto.parentId,
        finalName,
      );

      const folder = await this.prisma.fileHierarchy.create({
        data: {
          name: finalName,
          type: 'FOLDER',
          s3Key,
          parentId: dto.parentId,
          ownerId: userId,
        },
      });

      return this.toResponseDto(folder);

    } catch (error) {
      throw new Error(`Failed to create folder: ${error.message}`);
    }
  }

  async uploadToHierarchy(
    file: Express.Multer.File,
    userId: string,
    parentId?: string,
  ): Promise<FileHierarchyResponseDto> {
    // 1. Проверка родительской папки
    const parent = parentId
      ? await this.prisma.fileHierarchy.findFirstOrThrow({
          where: {
            primarykey: parentId,
            type: 'FOLDER',
            ownerId: userId,
          },
        })
      : null;

    // 2. Генерация уникального s3Key
    const s3Key = parent
      ? `${parent.s3Key}/${file.originalname}`
      : `users/${userId}/${file.originalname}`;

    // 3. Загрузка в S3
    const uploadedFile = await this.uploadAndSaveFile(
      file,
      'user-uploads',
      userId,
      file.mimetype,
    );

    const hierarchy = await this.prisma.fileHierarchy.create({
      data: {
        name: file.originalname,
        type: 'FILE',
        s3Key,
        parentId: parent?.primarykey,
        fileId: uploadedFile.primarykey,
        ownerId: userId,
      },
      include: { file: true },
    });

    return this.toResponseDto(hierarchy);
  }

  async moveHierarchyItem(
    itemId: string,
    newParentId: string,
    userId: string,
  ): Promise<FileHierarchyResponseDto> {
    const item = await this.prisma.fileHierarchy.findUniqueOrThrow({
      where: { primarykey: itemId },
      include: { children: true },
    });

    if (item.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const newParent = await this.prisma.fileHierarchy.findUniqueOrThrow({
      where: { primarykey: newParentId },
    });

    // Обновляем путь для всех дочерних элементов
    const updatePaths = async (currentItem: any, newBasePath: string) => {
      const newPath = `${newBasePath}/${currentItem.name}`;

      await this.prisma.fileHierarchy.update({
        where: { primarykey: currentItem.primarykey },
        data: { s3Key: newPath },
      });

      if (currentItem.children) {
        for (const child of currentItem.children) {
          await updatePaths(child, newPath);
        }
      }
    };

    await updatePaths(item, newParent.s3Key);

    return this.toResponseDto(
      await this.prisma.fileHierarchy.update({
        where: { primarykey: itemId },
        data: { parentId: newParentId },
      })
    );
  }

  // private async updateChildrenPaths(
  //   parentId: string,
  //   newBasePath: string,
  // ): Promise<void> {
  //   const children = await this.prisma.fileHierarchy.findMany({
  //     where: { parentId },
  //   });

  //   for (const child of children) {
  //     const newChildPath = `${newBasePath}/${child.name}`;

  //     await this.prisma.fileHierarchy.update({
  //       where: { primarykey: child.primarykey },
  //       data: { s3Key: newChildPath },
  //     });

  //     if (child.type === 'FOLDER') {
  //       await this.updateChildrenPaths(child.primarykey, newChildPath);
  //     }
  //   }
  // }

  // async softDeleteItem(itemId: string, userId: string): Promise<void> {
  //   const item = await this.prisma.fileHierarchy.findUniqueOrThrow({
  //     where: { primarykey: itemId }
  //   });

  //   if (item.ownerId !== userId) {
  //     throw new ForbiddenException('Access denied');
  //   }

  //   // Для файлов - помечаем как удаленные
  //   // Для папок - рекурсивно помечаем детей
  //   await this.markAsDeleted(itemId);
  // }

  async hardDeleteItem(itemId: string, userId: string): Promise<void> {
    const item = await this.prisma.fileHierarchy.findUniqueOrThrow({
      where: { primarykey: itemId },
      include: {
        children: true,
        file: true,
      },
    });

    if (item.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Удаляем из S3
    if (item.type === 'FILE' && item.file?.path) {
      await this.deleteFile(item.file.path);
    }
    // else if (item.type === 'FOLDER') {
    //   await this.deleteFolderFromS3(item.s3Key);
    // }

    // Рекурсивное удаление дочерних элементов
    if (item.children.length > 0) {
      for (const child of item.children) {
        await this.hardDeleteItem(child.primarykey, userId);
      }
    }

    await this.prisma.$transaction([
      this.prisma.fileHierarchy.delete({
        where: { primarykey: itemId },
      }),

      ...(item.fileId
        ? [
            this.prisma.file.delete({
              where: { primarykey: item.fileId },
          })]
      : []),
    ]);
  }

  async updateItemName(
    id: string,
    newName: string,
    userId: string,
  ): Promise<FileHierarchyResponseDto> {
    const item = await this.prisma.fileHierarchy.findUniqueOrThrow({
      where: { primarykey: id },
    });

    if (item.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updatedItem = await this.prisma.fileHierarchy.update({
      where: { primarykey: id },
      data: { name: newName },
    });

    return this.toResponseDto(updatedItem);
  }

  async getFileTree(
    userId: string,
    parentId?: string,
  ): Promise<FileHierarchyResponseDto[]> {
    const allItems = await this.prisma.fileHierarchy.findMany({
      where: {
        ownerId: userId,
        isDeleted: false,
      },
      include: {
        file: true,
      },
      orderBy: [{ type: 'desc' }, { name: 'asc' }],
    });

    // Строим дерево
    const buildTree = (
      items: any[],
      parentId?: string | null,
    ): FileHierarchyResponseDto[] => {
      return items
        .filter((item) => item.parentId === parentId)
        .map((item) => ({
          ...this.toResponseDto(item),
          children: buildTree(items, item.primarykey),
        }));
    };

    return buildTree(allItems, parentId ? parentId : null);
  }

  async getFileDownloadUrl(hierarchyId: string, userId: string) {
    const hierarchyItem = await this.prisma.fileHierarchy.findUnique({
      where: { primarykey: hierarchyId },
      include: { file: true },
    });

    if (!hierarchyItem) {
      throw new NotFoundException('File not found');
    }

    if (hierarchyItem.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (hierarchyItem.type !== 'FILE') {
      throw new BadRequestException('Cannot download folders');
    }

    if (!hierarchyItem.file?.path) {
      throw new NotFoundException('File content missing');
    }

    return {
      name: hierarchyItem.name,
      url: hierarchyItem.file.path,
      key: hierarchyItem.file.path,
    };
  }

  async readFileContent(key: string): Promise<string> {
    try {
      const exkey = this.extractS3Key(key)
      const response = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: exkey,
        }),
      );

      if (!response.Body) {
        throw new Error('Empty response body from S3');
      }

      return await response.Body.transformToString();
    } catch (error) {
      throw new Error(`Failed to read file content: ${error.message}`);
    }
  }

  async writeFileContent(key: string, content: string): Promise<void> {
    try {
      const exkey = this.extractS3Key(key)
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: exkey,
          Body: content,
          ContentType: 'text/plain',
        }),
      );
    } catch (error) {
      throw new Error(`Failed to write file content: ${error.message}`);
    }
  }

  private extractS3Key(url: string): string {
    // Для URL формата: https://s3.cloud.ru/bucket-maps/badgi/avatars/...
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    // Находим индекс 'badgi' в пути
    const badgiIndex = pathParts.indexOf('badgi');

    // Извлекаем часть после 'badgi/avatars/'
    return `badgi/${pathParts[badgiIndex + 1]}/${pathParts.slice(badgiIndex + 2).join('/')}`;
  }

  async shareFile(
    hierarchyId: string,
    targetAccountId: string,
    authUserId: string,
    permission: SharePermission = SharePermission.VIEW,
  ) {
    // Проверяем, что сам файл существует и текущий юзер — владелец
    const item = await this.prisma.fileHierarchy.findUnique({
      where: { primarykey: hierarchyId },
    });
    if (!item) throw new NotFoundException('File not found');
    if (item.ownerId !== authUserId) {
      throw new ForbiddenException('Only owner can share');
    }

    // Создаём запись в file_shares
    const share = await this.prisma.fileShare.create({
      data: {
        fileHierarchyId: hierarchyId,
        accountId: targetAccountId,
        permission,
      },
    });
    return share;
  }

  async unshareFile(
    hierarchyId: string,
    targetAccountId: string,
    authUserId: string,
  ) {
    // Проверяем владелец
    const item = await this.prisma.fileHierarchy.findUnique({
      where: { primarykey: hierarchyId },
    });
    if (!item) throw new NotFoundException('File not found');
    if (item.ownerId !== authUserId) {
      throw new ForbiddenException('Only owner can unshare');
    }

    console.log(hierarchyId, targetAccountId)

    await this.prisma.fileShare.delete({
      where: {
        uniq_file_share: {
          fileHierarchyId: hierarchyId,
          accountId: targetAccountId,
        },
      },
    });
  }

  async getAccessibleTree(userId: string, parentId?: string) {
    // получаем все свои
    const own = await this.getFileTree(userId, parentId);
    // достаём записи шаринга
    const shares = await this.prisma.fileShare.findMany({
      where: { accountId: userId },
      include: {
        fileHierarchy: { include: { children: true } },
      },
    });
    // вытаскиваем их FileHierarchyResponseDto
    const shared = shares.map(s => this.toResponseDto(s.fileHierarchy));
    return [...own, ...shared];
  }

  public toResponseDto(item: any): FileHierarchyResponseDto {
    return new FileHierarchyResponseDto({
      id: item.primarykey,
      name: item.name,
      type: item.type,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      url: item.file?.path,
      size: item.file?.size,
      mimeType: item.file?.mimeType,
      children: item.children?.map((c) => this.toResponseDto(c)),
    });
  }
}
