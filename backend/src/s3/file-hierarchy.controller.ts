import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Get,
  Query,
  Param,
  Delete,
  Req,
  UseGuards,
  UnauthorizedException,
  Res,
  Patch,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { S3Service } from './s3.service';
import { CreateFolderDto } from './dto/createfolder.dto';
import { UploadFileDto } from './dto/updatefile.dto';
import { MoveItemDto } from './dto/moveitem.do';
import { FileHierarchyResponseDto } from './dto/FileHierarchyResponse.dto';
// import { BreadcrumbDto } from './dto/breadcrumb.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { SharePermission } from '@prisma/client';

@Controller('file-hierarchy')
@UseGuards(JwtAuthGuard)
export class FileHierarchyController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('folders')
  async createFolder(
    @Body() dto: CreateFolderDto,
    @Req() req: Request,
  ): Promise<FileHierarchyResponseDto> {
    const userId = this.extractUserId(req);
    return this.s3Service.createFolder(userId, dto);
  }

  @Post('files')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @Query('parentId') parentId: string,
    @Req() req: Request,
  ): Promise<FileHierarchyResponseDto> {
    const userId = this.extractUserId(req);

    const decodedName = Buffer.from(file.originalname, 'binary').toString(
      'utf8',
    );
    console.log('Decoded filename:', decodedName);
    console.log(file)
    console.log(encodeURIComponent(file.originalname))

    file.originalname = decodedName;
    return this.s3Service.uploadToHierarchy(file, userId, parentId);
  }

  @Get('tree')
  async getFileTree(
    @Query('parentId') parentId: string,
    @Req() req: Request,
  ): Promise<FileHierarchyResponseDto[]> {
    const userId = this.extractUserId(req);
    return this.s3Service.getFileTree(userId, parentId);
  }

  @Post('move/:itemId')
  async moveItem(
    @Param('itemId') itemId: string,
    @Body() dto: MoveItemDto,
    @Req() req: Request,
  ): Promise<FileHierarchyResponseDto> {
    const userId = this.extractUserId(req);
    return this.s3Service.moveHierarchyItem(itemId, dto.newParentId, userId);
  }

  @Get('download/:id')
  async getFileUrl(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = this.extractUserId(req);
    const { url, name } = await this.s3Service.getFileDownloadUrl(id, userId);

    return {
      url: url,
      name: name,
    };
  }

  @Patch(':id')
  async renameItem(
    @Param('id') id: string,
    @Body() dto: { name: string },
    @Req() req: Request,
  ) {
    const userId = this.extractUserId(req);
    return this.s3Service.updateItemName(id, dto.name, userId);
  }

  @Delete(':itemId')
  async deleteItem(
    @Param('itemId') itemId: string,
    @Req() req: Request,
  ): Promise<void> {
    const userId = this.extractUserId(req);
    return this.s3Service.hardDeleteItem(itemId, userId);
  }

  @Get('content/:id')
  async getFileContent(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<{ content: string }> {
    const userId = this.extractUserId(req);

    // 1. Получаем информацию о файле из иерархии
    const hierarchyItem = await this.s3Service.prisma.fileHierarchy.findUnique({
      where: { primarykey: id },
      include: { file: true },
    });

    if (!hierarchyItem || hierarchyItem.ownerId !== userId) {
      throw new NotFoundException('File not found or access denied');
    }

    if (hierarchyItem.type !== 'FILE' || !hierarchyItem.file) {
      throw new BadRequestException('Only files can be edited');
    }

    // 2. Проверяем MIME-тип (разрешаем только текстовые файлы)
    const allowedMimeTypes = [
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'application/json',
      'application/xml',
    ];

    if (
      !hierarchyItem.file ||
      !allowedMimeTypes.some((type) =>
        hierarchyItem.file!.mimeType.includes(type),
      )
    ) {
      throw new BadRequestException('File type not supported for editing');
    }

    // 3. Читаем содержимое файла из S3
    const content = await this.s3Service.readFileContent(
      hierarchyItem.file.path,
    );

    return { content };
  }

  @Patch('content/:id')
  async updateFileContent(
    @Param('id') id: string,
    @Body() dto: { content: string },
    @Req() req: Request,
  ): Promise<{ success: boolean }> {
    const userId = this.extractUserId(req);

    // 1. Проверяем права и существование файла
    const hierarchyItem = await this.s3Service.prisma.fileHierarchy.findUnique({
      where: { primarykey: id },
      include: { file: true },
    });

    if (!hierarchyItem || hierarchyItem.ownerId !== userId) {
      throw new NotFoundException('File not found or access denied');
    }

    if (hierarchyItem.type !== 'FILE' || !hierarchyItem.file) {
      throw new BadRequestException('Only files can be edited');
    }

    // 2. Обновляем содержимое в S3
    await this.s3Service.writeFileContent(hierarchyItem.file.path, dto.content);

    // 3. Обновляем метаданные в БД
    await this.s3Service.prisma.file.update({
      where: { primarykey: hierarchyItem.file.primarykey },
      data: {},
    });

    return { success: true };
  }


  /** Шарим файл */
  @Post(':id/share')
  async shareFile(
    @Param('id') id: string,
    @Body('accountId') accountId: string,
    @Body('permission') permission: SharePermission,
    @Req() req: Request,
  ) {
    const userId = this.extractUserId(req);
    return this.s3Service.shareFile(id, accountId, userId, permission);
  }

  @Get(':id/share')
  async listShares(
    @Param('id') hierarchyId: string,
    @Req() req: Request,
  ): Promise<{ accountId: string; permission: SharePermission }[]> {
    const userId = this.extractUserId(req);

    // Проверяем, что узел существует и текущий — его владелец
    const item = await this.s3Service.prisma.fileHierarchy.findUnique({
      where: { primarykey: hierarchyId },
    });
    if (!item || item.ownerId !== userId) {
      throw new ForbiddenException('Нет доступа к этому файлу');
    }

    // Получаем все шаринги для этого узла
    const shares = await this.s3Service.prisma.fileShare.findMany({
      where: { fileHierarchyId: hierarchyId },
      include: { account: { select: { firstName: true, lastName: true } } },
    });

    // Мапим в упрощенный формат
    return shares.map(s => ({
      accountId: s.accountId,
      permission: s.permission,
      name: `${s.account.firstName} ${s.account.lastName}`
    }));
  }

  /** Убираем шаринг */
  @Delete(':id/share/:accountId')
  async unshareFile(
    @Param('id') id: string,
    @Param('accountId') accountId: string,
    @Req() req: Request,
  ) {
    const userId = this.extractUserId(req);
    return this.s3Service.unshareFile(id, accountId, userId);
  }

  /** Получить дерево включая шаренные */
  @Get('tree-all')
  async getAllAccessible(
    @Query('parentId') parentId: string,
    @Req() req: Request,
  ): Promise<FileHierarchyResponseDto[]> {
    const userId = this.extractUserId(req);
    return this.s3Service.getAccessibleTree(userId, parentId);
  }

  @Get('shared-only')
  async getSharedOnly(
    @Req() req: Request,
  ): Promise<FileHierarchyResponseDto[]> {
    const userId = this.extractUserId(req);
    const shares = await this.s3Service.prisma.fileShare.findMany({
      where: { accountId: userId },
      include: {
        fileHierarchy: {
          include: {
            file: true,            // <— добавляем
            children: {
              include: {
                file: true,        // <— и здесь
                children: {
                  include: { file: true } // если нужна вложенная
                }
              }
            }
          }
        }
      }
    });
    return shares.map(s => this.s3Service.toResponseDto(s.fileHierarchy));
  }

  private extractUserId(req: Request): string {
    const userId = req.user?.primarykey;
    if (!userId) throw new UnauthorizedException('Требуется авторизация');
    return userId;
  }
}
