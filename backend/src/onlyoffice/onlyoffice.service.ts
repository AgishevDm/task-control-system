import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { S3Service } from '../s3/s3.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SharePermission } from '@prisma/client';

@Injectable()
export class OnlyofficeService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly s3Service: S3Service,
    public readonly prisma: PrismaService,
  ) {}

  /**
   * Генерирует presigned URL для доступа к файлу в S3
   */
  async getPresignedUrl(key: string): Promise<string> {
    return this.s3Service.generatePresignedUrl(key);
  }

  /**
   * Формирует конфигурацию для OnlyOffice Editor и подписывает JWT
   */
  async createEditorConfig(
    fileKeyOrUrl: string,
    user: { id: string },
    fileHierarchyId?: string,
  ) {
    // получаем presigned URL из S3
    let presignedUrl: string;
    let cleanKey: string;
    try {
      const parsed = new URL(fileKeyOrUrl);
      // Это URL, используем его напрямую для загрузки документа
      presignedUrl = fileKeyOrUrl;
      // Извлекаем путь после бакета: '/bucket-maps/...'
      const pathname = parsed.pathname; // '/bucket-maps/badgi/...'
      const bucketName = process.env.AWS_BUCKET_NAME!;
      // Убираем '/{bucketName}/' из начала
      cleanKey = pathname.startsWith(`/${bucketName}/`)
        ? pathname.replace(`/${bucketName}/`, '')
        : pathname.substring(1);
    } catch {
      // Не URL, значит передали чистый S3-ключ
      cleanKey = fileKeyOrUrl;
      presignedUrl = await this.s3Service.generatePresignedUrl(cleanKey);
    }

    // 2) Определяем расширение по cleanKey
    const fileExt = cleanKey.split('.').pop()!.toLowerCase();
    const documentType =
      fileExt === 'pptx' ? 'slide' : fileExt === 'xlsx' ? 'cell' : 'word';

    const shardKey = cleanKey
      .replace(/\//g, '_') // слэши → подчеркивания
      .replace(/[^0-9A-Za-z_.-]/g, '');

    const originalFilename = cleanKey.split('/').pop()!;

    const nameFile = await this.prisma.file.findFirst({
      where: { path: fileKeyOrUrl },
    });

    const userInfo = await this.prisma.account.findFirst({
      where: { primarykey: user.id },
      select: {
        primarykey: true,
        lastName: true,
        firstName: true,
        avatarUrl: true,
      },
    });

    let permission: SharePermission = SharePermission.EDIT;

    if (fileHierarchyId) {
      // Проверяем, может быть владелец?
      const hierarchyItem = await this.prisma.fileHierarchy.findUnique({
        where: { primarykey: fileHierarchyId },
      });
      if (!hierarchyItem) {
        throw new NotFoundException('File not found');
      }
      if (hierarchyItem.ownerId !== user.id) {
        // Ищем в шарингах
        const share = await this.prisma.fileShare.findUnique({
          where: {
            uniq_file_share: {
              fileHierarchyId,
              accountId: user.id,
            }
          }
        });
        if (!share) {
          throw new ForbiddenException('No access to document');
        }
        permission = share.permission;
      }
      // если владелец — оставляем EDIT
    }

    const mode = permission === SharePermission.VIEW ? 'view' : 'edit';
    const canEdit = permission === SharePermission.EDIT;
    const canComment = permission === SharePermission.EDIT || permission === SharePermission.COMMENT;

    //console.log(permission, mode, canEdit, canComment)
    // 3) Собираем конфиг
    const payload = {
      document: {
        fileType: fileExt,
        key: shardKey,
        title: nameFile?.filename,
        url: presignedUrl,
      },
      documentType,
      editorConfig: {
        callbackUrl: process.env.ONLYOFFICE_CALLBACK_URL,
        coEditing: { mode: 'fast', change: true },
        mode,
        lang: 'ru',
        user: {
          id: userInfo?.primarykey,
          name: `${userInfo?.lastName} ${userInfo?.firstName}`,
          image: userInfo?.avatarUrl || undefined,
        },
        permissions: {
          edit: canEdit,
          download: true,
          print: false,
          comment: canComment,
          copy: true,
          chat: true,
        },
      },
    };

    // 4) Подписываем JWT
    const token = this.jwtService.sign(payload);
    //console.log(payload)
    return { ...payload, token };
  }
}
