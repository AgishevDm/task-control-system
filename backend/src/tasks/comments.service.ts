// comments.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { Account } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Injectable()
@UseGuards(JwtAuthGuard)
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async getComments(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { primarykey: taskId },
      include: { projectRef: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId: task.project,
        accountId: userId,
      },
    });

    if (!isMember) throw new ForbiddenException('No access to task');

    return this.prisma.taskComment.findMany({
      where: { taskId },
      include: {
        account: {
          select: {
            primarykey: true,
            avatarUrl: true,
            email: true,
            firstName: true,
            lastName: true,
            login: true,
          },
        },
        CommentAttachment: {
          include: {
            file: true,
          },
        },
      },
    });
  }

  async createComment(
    taskId: string,
    userId: string,
    comment: string,
    files?: Express.Multer.File[],
  ) {
    const task = await this.prisma.task.findUnique({
      where: { primarykey: taskId },
      include: { projectRef: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId: task.project,
        accountId: userId,
      },
    });

    if (!isMember) throw new ForbiddenException('No access to task');

    const newComment = await this.prisma.taskComment.create({
      data: {
        taskId,
        accountId: userId,
        comment,
      },
      include: {
        account: {
          select: {
            primarykey: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        CommentAttachment: { include: { file: true } },
      },
    });

    if (files?.length) {
      await this.processFiles(newComment.primarykey, userId, files);
    }

    return newComment;

    // return this.prisma.taskComment.create({
    //   data: {
    //     taskId,
    //     accountId: userId,
    //     comment,
    //   },
    //   include: {
    //     account: {
    //       select: {
    //         primarykey: true,
    //         firstName: true,
    //         lastName: true,
    //         avatarUrl: true,
    //       },
    //     },
    //   },
    // });
  }

  async updateComment(
    commentId: string,
    userId: string,
    comment: string,
    files?: Express.Multer.File[],
  ) {
    const existing = await this.prisma.taskComment.findUnique({
      where: { primarykey: commentId },
    });

    if (!existing) throw new NotFoundException('Comment not found');
    if (existing.accountId !== userId) {
      throw new ForbiddenException('Cannot edit others comments');
    }

    const updatedComment = await this.prisma.taskComment.update({
      where: { primarykey: commentId },
      data: {
        comment,
        updatedAt: new Date(),
      },
      include: {
        account: {
          select: {
            primarykey: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        CommentAttachment: { include: { file: true } },
      },
    });

    if (files?.length) {
      await this.processFiles(commentId, userId, files);
    }

    return updatedComment;

    // return this.prisma.taskComment.update({
    //   where: { primarykey: commentId },
    //   data: {
    //     comment,
    //     updatedAt: new Date(),
    //   },
    //   include: {
    //     account: {
    //       select: {
    //         primarykey: true,
    //         firstName: true,
    //         lastName: true,
    //         avatarUrl: true,
    //       },
    //     },
    //   },
    // });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.taskComment.findUnique({
      where: { primarykey: commentId },
    });

    if (!comment) throw new NotFoundException('Comment not found');

    const task = await this.prisma.task.findUnique({
      where: { primarykey: comment.taskId },
      include: { projectRef: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isAdmin = await this.prisma.projectMember.findFirst({
      where: {
        projectId: task.project,
        accountId: userId,
        role: { name: 'ADMIN' },
      },
    });

    if (comment.accountId !== userId && !isAdmin) {
      throw new ForbiddenException('No permission to delete comment');
    }

    await this.prisma.commentAttachment.deleteMany({
      where: {
        commentId: comment.primarykey,
      },
    });

    return this.prisma.taskComment.delete({
      where: { primarykey: commentId },
    });
  }

  async processFiles(
    commentId: string,
    userId: string,
    files: Express.Multer.File[],
  ) {
    await Promise.all(
      files.map(async (file) => {
        const uploadedFile = await this.s3Service.uploadFile(
          file,
          'comments',
          userId,
        );

        // const createdFile = await this.prisma.file.create({
        //   data: {
        //     filename: file.originalname,
        //     path: uploadedFile.key,
        //     size: file.size,
        //     mimeType: file.mimetype,
        //     uploadedBy: { connect: { primarykey: userId } },
        //   },
        // });

        await this.prisma.commentAttachment.create({
          data: {
            commentId,
            fileId: uploadedFile.primarykey,
            uploadedById: userId,
          },
        });
      }),
    );
  }
}
