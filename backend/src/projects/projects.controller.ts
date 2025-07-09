import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UnauthorizedException,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/create-project.dto';
import { S3Service } from '../s3/s3.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { TasksService } from 'src/tasks/tasks.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
    private readonly s3Service: S3Service,
  ) {}

  @Get()
  async getUserProjects(@Req() req: Request) {
    const userId = this.extractUserId(req);
    return this.projectsService.getUserProjects(userId);
  }

  @Get('/my-memberships')
  async getProjectsWhereMember(@Req() req: Request) {
    const userId = this.extractUserId(req);
    return this.projectsService.getProjectsWhereMember(userId);
  }

  @Get(':id')
  async getProjectById(@Req() req: Request, @Param('id') projectId: string) {
    const userId = this.extractUserId(req);
    return this.projectsService.getProjectWithAuthCheck(userId, projectId);
  }

  @Post()
  async createNewProject(@Req() req: Request, @Body() dto: CreateProjectDto) {
    const userId = this.extractUserId(req);
    return this.projectsService.createProject(userId, dto);
  }

  @Patch(':id')
  async updateProjectInfo(
    @Req() req: Request,
    @Param('id') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    const userId = this.extractUserId(req);
    return this.projectsService.updateProject(userId, projectId, dto);
  }

  @Delete(':id')
  async deleteProject(@Req() req: Request, @Param('id') projectId: string) {
    const userId = this.extractUserId(req);
    return this.projectsService.deleteProject(userId, projectId);
  }

  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('logo'))
  async uploadProjectLogo(
    @Req() req: Request,
    @Param('id') projectId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = this.extractUserId(req);
    return this.projectsService.handleLogoUpload(userId, projectId, file);
  }

  private extractUserId(req: Request): string {
    const userId = req.user?.primarykey;
    if (!userId) throw new UnauthorizedException('Требуется авторизация');
    return userId;
  }

  @Get(':projectId/milestones')
  getByProject(@Req() req: Request, @Param('projectId') projectId: string) {
    this.extractUserId(req);
    return this.projectsService.getByProject(projectId);
  }

  @Post(':projectId/milestones')
  create(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    this.extractUserId(req);
    return this.projectsService.create(projectId, dto);
  }

  @Patch('milestones/:id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    this.extractUserId(req);
    return this.projectsService.update(id, dto);
  }

  @Delete('milestones/:id')
  delete(@Req() req: Request, @Param('id') id: string) {
    this.extractUserId(req);
    return this.projectsService.delete(id);
  }

  @Get('milestones/:id/tasks')
  getByMilestone(@Req() req: Request, @Param('id') id: string) {
    const userId = this.extractUserId(req);
    return this.tasksService.getTasksByMilestone(id);
  }
}
