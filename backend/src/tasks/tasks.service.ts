// tasks.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { Account } from '@prisma/client';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async getTasks(
    userId: string,
    filters: {
      projectId?: string;
      status?: string;
      stage?: string;
      search?: string;
    },
  ) {
    const tasks = await this.prisma.task.findMany({
      where: {
        createdBy: userId,
        // projectRef: {
        //   ProjectMember: {
        //     some: {
        //       accountId: userId,
        //     },
        //   },
        // },
        // ...filters,
      },
      include: {
        projectRef: true,
        assignedToRef: {
          select: {
            avatarUrl: true,
            email: true,
            firstName: true,
            lastName: true,
            login: true,
          },
        },
        comments: {
          include: {
            account: true,
          },
        },
        attachments: {
          include: {
            file: true,
          },
        },
      },
    });
    return tasks.map((task) => {
      const { assignedToRef, ...rest } = task;
      const assigned = assignedToRef
        ? {
            ...assignedToRef,
            name: `${assignedToRef.firstName || ''} ${assignedToRef.lastName || ''}`.trim(),
          }
        : null;
      return {
        ...rest,
        assigned,
      };
    });
  }

  async getProjectTasks(
    userId: string,
    filters: {
      projectId?: string;
      status?: string;
      stage?: string;
      search?: string;
    },
  ) {
    const tasks = await this.prisma.task.findMany({
      where: {
        project: filters.projectId,
      },
      include: {
        projectRef: true,
        assignedToRef: {
          select: {
            avatarUrl: true,
            email: true,
            firstName: true,
            lastName: true,
            login: true,
          },
        },
        comments: {
          include: {
            account: true,
          },
        },
        attachments: {
          include: {
            file: true,
          },
        },
      },
    });
    return tasks.map((task) => {
      const { assignedToRef, ...rest } = task;
      const assigned = assignedToRef
        ? {
            ...assignedToRef,
            name: `${assignedToRef.firstName || ''} ${assignedToRef.lastName || ''}`.trim(),
          }
        : null;
      return {
        ...rest,
        assigned,
      };
    });
  }

  async getTask(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { primarykey: id },
      include: {
        projectRef: {
          include: {
            ProjectMember: true,
          },
        },
        assignedToRef: {
          select: {
            primarykey: true,
            avatarUrl: true,
            email: true,
            firstName: true,
            lastName: true,
            login: true,
          },
        },
        comments: {
          include: {
            account: true,
            //CommentAttachment: true,
          },
        },
        attachments: {
          include: {
            file: true,
          },
        },
      },
    });

    if (!task) throw new NotFoundException('Task not found');

    const isMember = task.projectRef.ProjectMember.some(
      (m) => m.accountId === userId,
    );

    const isCreatorPorject = await this.prisma.project.findFirst({
      where: {
        primarykey: task.project,
        createdBy: userId,
      },
    });

    if (!isMember && !isCreatorPorject)
      throw new ForbiddenException('No access to task');

    const { assignedToRef, ...rest } = task;

    const assigned = assignedToRef
      ? {
          ...assignedToRef,
          id: assignedToRef.primarykey,
          name: `${assignedToRef.firstName || ''} ${assignedToRef.lastName || ''}`.trim(),
        }
      : null;

    return {
      ...rest,
      assigned,
    };
  }

  async createTask(userId: string, dto: CreateTaskDto) {
    const project = await this.prisma.project.findUnique({
      where: { primarykey: dto.project },
      include: { ProjectMember: true },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (
      !project.ProjectMember.some((m) => m.accountId === userId) &&
      project.createdBy !== userId
    ) {
      throw new ForbiddenException('No access to project');
    }

    const lastTask = await this.prisma.task.findFirst({
      where: { project: dto.project },
      orderBy: { number: 'desc' },
    });

    const created = await this.prisma.task.create({
      data: {
        ...dto,
        number: (lastTask?.number || 0) + 1,
        createdBy: userId,
        project: dto.project,
        assignedTo: dto.assignedTo || null,
      },
    });
    return created;
  }

  async updateTask(id: string, userId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { primarykey: id },
      include: { projectRef: true },
    });

    if (!task) throw new NotFoundException('Task not found');

    const isMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId: task.project,
        accountId: userId,
      },
    });

    const isCreatorPorject = await this.prisma.project.findFirst({
      where: {
        primarykey: task.project,
        createdBy: userId,
      },
    });

    if (!isMember && !isCreatorPorject)
      throw new ForbiddenException('No access to task');

    return this.prisma.task.update({
      where: { primarykey: id },
      data: {
        ...dto,
        assignedTo: dto.assignedTo,
      },
    });
  }

  async deleteTask(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { primarykey: id },
      include: { projectRef: true },
    });

    if (!task) throw new NotFoundException('Task not found');

    if (task.createdBy !== userId) {
      throw new ForbiddenException('Only task creator can delete it');
    }

    await this.prisma.taskComment.deleteMany({
      where: {
        taskId: task.primarykey,
      },
    });

    return this.prisma.task.delete({
      where: { primarykey: id },
    });
  }

  async attachFile(taskId: string, userId: string, file: Express.Multer.File) {
    const task = await this.prisma.task.findUnique({
      where: { primarykey: taskId },
      include: { projectRef: true },
    });

    if (!task) throw new NotFoundException('Task not found');

    const isMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId: task.project,
        accountId: userId,
      },
    });

    const isCreatorPorject = await this.prisma.project.findFirst({
      where: {
        primarykey: task.project,
        createdBy: userId,
      },
    });

    if (!isMember && !isCreatorPorject)
      throw new ForbiddenException('No access to task');

    const uploadedFile = await this.s3Service.uploadFile(file, 'tasks');

    const createdFile = await this.prisma.file.create({
      data: {
        filename: file.originalname,
        path: uploadedFile.key,
        size: file.size,
        mimeType: file.mimetype,
        uploadedBy: { connect: { primarykey: userId } },
      },
    });

    return this.prisma.taskAttachment.create({
      data: {
        taskId: taskId,
        fileId: createdFile.primarykey,
        uploadedBy: userId,
      },
    });
  }

  async getTasksByMilestone(milestoneId: string) {
    const raw = await this.prisma.task.findMany({
      where: { milestoneId },
      orderBy: { startDate: 'asc' },
      include: {
        assignedToRef: {
          select: {
            primarykey: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
    });

    const tasks = raw.map(task => {
      const { assignedToRef, _count, ...rest } = task;
      return {
        ...rest,
        // переименовываем и формируем объект assigned
        commentsCount: _count.comments,
        attachmentsCount: _count.attachments,
        assigned: assignedToRef
          ? {
              name: `${assignedToRef.firstName} ${assignedToRef.lastName}`.trim(),
              avatarUrl: assignedToRef.avatarUrl,
            }
          : undefined,
      };
    });
    // console.log(tasks)
    return tasks;
  }
}
