// comments.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  MaxFileSizeValidator,
  ParseFilePipe,
  ParseUUIDPipe,
  Req,
  UnauthorizedException,
  UploadedFiles,
  Patch,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('tasks/:taskId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  async getComments(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Req() req: Request,
  ) {
    const userId = this.extractUserId(req);
    return this.commentsService.getComments(taskId, userId);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async createComment(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() createCommentDto: CreateCommentDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 10MB
        ],
        fileIsRequired: false,
      }),
    )
    files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    const userId = this.extractUserId(req);
    const processedFiles =
      files?.map((file) => {
        const decodedName = Buffer.from(file.originalname, 'binary').toString(
          'utf8',
        );
        console.log('Decoded filename:', decodedName);
        console.log('Original filename:', file.originalname);

        return {
          ...file,
          originalname: decodedName,
        };
      }) || [];

    return this.commentsService.createComment(
      taskId,
      userId,
      createCommentDto.comment,
      processedFiles,
    );
  }

  @Patch(':commentId')
  async updateComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body('comment') comment: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 })],
        fileIsRequired: false,
      }),
    )
    files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    const userId = this.extractUserId(req);
    return this.commentsService.updateComment(
      commentId,
      userId,
      comment,
      files,
    );
  }

  @Delete(':commentId')
  async deleteComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Req() req: Request,
  ) {
    const userId = this.extractUserId(req);
    return this.commentsService.deleteComment(commentId, userId);
  }

  private extractUserId(req: Request): string {
    const userId = req.user?.primarykey;
    if (!userId) throw new UnauthorizedException('Требуется авторизация');
    return userId;
  }
}
