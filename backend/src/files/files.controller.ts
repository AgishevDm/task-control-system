import {
  Controller,
  Post,
  Get,
  Delete,
  UploadedFile,
  UseInterceptors,
  Param,
  Res,
  StreamableFile,
  NotFoundException,
  BadRequestException,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../s3/s3.service';
import { Public } from 'src/common/decorators/public.decorator';
import { Response } from 'express';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { SystemRole } from 'src/enums/roles/role.enum';

@Public()
@UseGuards(RolesGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly s3Service: S3Service) {}

  private readonly allowedSubfolders = ['avatars', 'documents', 'images'];

  @Post('upload/:subfolder')
  @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.USER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('subfolder') subfolder: string,
    @Body() body: { userId?: string; fileType?: string },
  ) {
    if (!this.allowedSubfolders.includes(subfolder)) {
      throw new BadRequestException('Invalid subfolder name');
    }

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.s3Service.uploadAndSaveFile(
      file,
      subfolder,
      body.userId,
      body.fileType,
    );
  }

  @Get(':key')
  async getFile(
    @Param('key') key: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!(await this.s3Service.fileExists(key))) {
      throw new NotFoundException('File not found');
    }

    const stream = await this.s3Service.getFileStream(key);
    if (!stream) {
      throw new NotFoundException('File not found');
    }

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${key.split('/').pop()}"`,
    });

    return new StreamableFile(stream);
  }

  @Get(':key/url')
  async getPresignedUrl(@Param('key') key: string) {
    if (!(await this.s3Service.fileExists(key))) {
      throw new NotFoundException('File not found');
    }

    const url = await this.s3Service.generatePresignedUrl(key);
    return { url };
  }

  @Delete(':key')
  async deleteFile(@Param('key') key: string) {
    await this.s3Service.deleteFileWithDbRecord(key);
    return { message: 'File deleted successfully' };
  }

  @Get('user/:userId')
  async getUserFiles(@Param('userId') userId: string) {
    return this.s3Service.getUserFiles(userId);
  }
}
