import { Controller, Get, Query, UseGuards, Req, Body, Post } from '@nestjs/common';
import { OnlyofficeService } from './onlyoffice.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Request } from 'express';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('onlyoffice')
export class OnlyofficeController {
  constructor(private readonly svc: OnlyofficeService) {}

  // API для выдачи конфигурации редактора
  @UseGuards(JwtAuthGuard)
  @Get('config')
  async getConfig(
    @Req() req: Request,
    @Query('fileKey') fileKey: string,
    @Query('fileId') fileId: string,
  ) {
    const userId = (req.user as any).primarykey;
    return this.svc.createEditorConfig(fileKey, { id: userId }, fileId);
  }

  // Callback от OnlyOffice (public)
  @Post('callback')
  @Public()
  async callback(@Body() data: any) {
    // если data.status === 2: сохраняем документ (fetch(data.url) → S3)
    return { error: 0 };
  }
}
