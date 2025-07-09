// tasks.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  Req,
  UnauthorizedException,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async getTasks(
    @Req() req: Request,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('stage') stage?: string,
    @Query('search') search?: string,
  ) {
    const userId = this.extractUserId(req);
    console.log('gwwgwge')
    return this.tasksService.getTasks(userId, {
      projectId,
      status,
      stage,
      search,
    });
  }

  @Get('/project/:projectId')
  async getTasksByProject(
    @Req() req: Request,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('status') status?: string,
    @Query('stage') stage?: string,
    @Query('search') search?: string,
  ) {
    const userId = this.extractUserId(req);
    console.log(projectId)
    return this.tasksService.getProjectTasks(userId, {
      projectId,
      status,
      stage,
      search,
    });
  }

  @Get(':id')
  async getTaskById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const userId = this.extractUserId(req);
    return this.tasksService.getTask(id, userId);
  }

  @Post()
  async createTask(@Body() dto: CreateTaskDto, @Req() req: Request) {
    const userId = this.extractUserId(req);
    console.log('asdf sdf fsd')
    return this.tasksService.createTask(userId, dto);
  }

  @Patch(':id')
  async updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: Request,
  ) {
    const userId = this.extractUserId(req);
    return this.tasksService.updateTask(id, userId, dto);
  }

  @Delete(':id')
  async deleteTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const userId = this.extractUserId(req);
    return this.tasksService.deleteTask(id, userId);
  }

  @Post(':id/attach')
  @UseInterceptors(FileInterceptor('file'))
  async attachFile(
    @Param('id', ParseUUIDPipe) taskId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const userId = this.extractUserId(req);
    return this.tasksService.attachFile(taskId, userId, file);
  }

  private extractUserId(req: Request): string {
    const userId = req.user?.primarykey;
    if (!userId) throw new UnauthorizedException('Требуется авторизация');
    return userId;
  }
}
