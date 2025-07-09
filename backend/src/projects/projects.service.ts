import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectMemberDto,
  ProjectTeamDto,
} from './dto/create-project.dto';
import { Prisma, TeamMember } from '@prisma/client';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  private async getRoleIdByCode(roleCode: string): Promise<string> {
    const role = await this.prisma.projectRole.findFirst({
      where: { name: roleCode.toUpperCase() },
    });

    if (!role) {
      throw new NotFoundException(`Роль с кодом ${roleCode} не найдена`);
    }

    return role.primarykey;
  }

  async getUserProjects(userId: string) {
    return this.prisma.project.findMany({
      where: { createdBy: userId },
      include: {
        ProjectMember: {
          include: {
            account: {
              select: {
                primarykey: true,
                avatarUrl: true,
                firstName: true,
                lastName: true,
                login: true,
              },
            },
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        teams: {
          include: {
            members: {
              include: {
                account: {
                  select: {
                    email: true,
                    login: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getProjectsWhereMember(userId: string) {
    return this.prisma.project.findMany({
      where: {
        ProjectMember: {
          some: {
            accountId: userId,
          },
        },
      },
      include: {
        ProjectMember: {
          include: {
            account: {
              select: {
                primarykey: true,
                avatarUrl: true,
                firstName: true,
                lastName: true,
                login: true,
              },
            },
            role: true,
          },
        },
        teams: {
          include: {
            members: {
              include: {
                account: {
                  select: {
                    email: true,
                    login: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getProjectWithAuthCheck(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { primarykey: projectId },
      include: {
        ProjectMember: {
          include: {
            account: {
              select: {
                primarykey: true,
                email: true,
                login: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            role: true,
          },
        },
        teams: {
          include: {
            members: {
              include: {
                account: {
                  select: {
                    primarykey: true,
                    email: true,
                    login: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!project) throw new NotFoundException('Проект не найден');
    if (project.createdBy !== userId)
      throw new ForbiddenException('Доступ запрещен');

    return project;
  }

  async createProject(userId: string, dto: CreateProjectDto) {
    return this.prisma.$transaction(async (prisma) => {
      const project = await prisma.project.create({
        data: {
          name: dto.name,
          description: dto.description,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          status: dto.status || 'В работе',
          logoUrl: null,
          createdBy: userId,
        },
      });

      // Создаем участников проекта
      for (const memberDto of dto.ProjectMember) {
        const roleId = await this.getRoleIdByCode(memberDto.role.name);

        await prisma.projectMember.create({
          data: {
            projectId: project.primarykey,
            accountId: memberDto.accountId,
            roleId: roleId,
            assignedById: userId,
          },
        });
      }

      // Создаем команды
      for (const teamDto of dto.teams) {
        const team = await prisma.team.create({
          data: {
            name: teamDto.name,
            project: project.primarykey,
            createdBy: userId,
          },
        });

        // Добавляем участников в команду
        await Promise.all(
          teamDto.members.map(async (member) => {
            return prisma.teamMember.create({
              data: {
                teamId: team.primarykey,
                accountId: member.accountId,
                role: member.role,
              },
            });
          }),
        );
      }

      return this.getFullProject(project.primarykey);
    });
  }

  async updateProject(
    userId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ) {
    await this.validateProjectOwnership(userId, projectId);

    return this.prisma.$transaction(async (prisma) => {
      // Обновление основной информации проекта
      await prisma.project.update({
        where: { primarykey: projectId },
        data: {
          name: dto.name,
          description: dto.description,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          status: dto.status,
        },
      });

      // Синхронизация участников проекта
      console.log('start ', dto.ProjectMember, ' end')
      if (dto.ProjectMember) {
        await this.syncProjectMembers(
          prisma,
          projectId,
          dto.ProjectMember,
          userId,
        );
      }

      // Синхронизация команд
      if (dto.teams) {
        console.log('Тут ', dto.teams)
        await this.syncTeams(prisma, projectId, dto.teams, userId);
      }

      return this.getFullProject(projectId);
    });
  }

  private async syncProjectMembers(
    prisma: Prisma.TransactionClient,
    projectId: string,
    members: ProjectMemberDto[],
    userId: string,
  ) {
    // Удаляем старых участников
    await prisma.projectMember.deleteMany({ where: { projectId } });

    console.log('новые участники')

    // Добавляем новых
    for (const member of members) {
      const roleId = await this.getRoleIdByCode(member.role.name);

      console.log(member)

      await prisma.projectMember.create({
        data: {
          projectId,
          accountId: member.accountId,
          roleId,
          assignedById: userId,
        },
      });
    }
  }

  private async syncTeams(
    prisma: Prisma.TransactionClient,
    projectId: string,
    teams: ProjectTeamDto[],
    userId: string,
  ) {
    const existingTeams = await prisma.team.findMany({
      where: { project: projectId },
      include: { members: true },
    });

    // Удаление команд
    const toDeleteTeams = existingTeams.filter(
      (et) => !teams.some((t) => t.primarykey === et.primarykey),
    );

    if (toDeleteTeams.length > 0) {
      await prisma.team.deleteMany({
        where: { primarykey: { in: toDeleteTeams.map((t) => t.primarykey) } },
      });
    }

    // Обновление и добавление команд
    for (const teamDto of teams) {
      console.log('обновление и добавление команд ', teamDto);
      if (teamDto.primarykey) {
        // Обновление существующей команды
        console.log('Обновляем команду', teamDto.primarykey);
        await prisma.team.update({
          where: { primarykey: teamDto.primarykey },
          data: { name: teamDto.name },
        });

        console.log('Обновление имени произошло');
        console.log(teamDto.members)

        // Синхронизация участников команды
        await this.syncTeamMembers(prisma, teamDto.primarykey, teamDto.members);
        console.log('Синхрон участников команд прошел');
      } else {
        // Создание новой команды
        console.log('Создаем новую команду');
        const newTeam = await prisma.team.create({
          data: {
            name: teamDto.name,
            project: projectId,
            createdBy: userId,
          },
        });

        if (!teamDto.members) return;

        // Добавление участников команды
        await Promise.all(
          teamDto.members.map(async (member) => {
            return prisma.teamMember.create({
              data: {
                teamId: newTeam.primarykey,
                accountId: member.accountId,
                role: member.role,
              },
            });
          }),
        );
      }
    }
  }

  private async syncTeamMembers(
    prisma: Prisma.TransactionClient,
    teamId: string,
    members: TeamMember[],
  ) {
    const existingMembers = await prisma.teamMember.findMany({
      where: { teamId },
    });

    // Удаление отсутствующих участников
    const toDelete = existingMembers.filter(
      (em) => !members.some((m) => m.primarykey === em.primarykey),
    );

    if (toDelete.length > 0) {
      await prisma.teamMember.deleteMany({
        where: { primarykey: { in: toDelete.map((m) => m.primarykey) } },
      });
    }

    console.log('Создаем человека в команде (перед циклом) ', members)

    if (!members) return;

    // Обновление и добавление участников
    for (const member of members) {
      console.log('Создаем человека в команде ', member);
      if (member.primarykey) {
        await prisma.teamMember.update({
          where: { primarykey: member.primarykey },
          data: {
            role: member.role,
          },
        });
      } else {
        console.log(
          'data for member - ',
          teamId,
          member.accountId,
          member.role,
        );
        await prisma.teamMember.create({
          data: {
            teamId,
            accountId: member.accountId,
            role: member.role,
          },
        });
      }
    }
  }

  private async getFullProject(projectId: string) {
    return this.prisma.project.findUnique({
      where: { primarykey: projectId },
      include: {
        ProjectMember: {
          include: {
            role: true,
            account: true,
          },
        },
        teams: {
          include: {
            members: {
              include: {
                account: true,
              },
            },
          },
        },
      },
    });
  }

  // Остальные методы остаются без изменений
  async deleteProject(userId: string, projectId: string) {
    const project = await this.validateProjectOwnership(userId, projectId);

    if (project.logoUrl) {
      await this.s3Service.deleteFileWithDbRecord(project.logoUrl);
    }

    await this.prisma.projectMember.deleteMany({
      where: { projectId: projectId },
    });

    await this.prisma.team.deleteMany({
      where: { project: projectId },
    });

    return this.prisma.project.delete({
      where: { primarykey: projectId },
    });
  }

  async handleLogoUpload(
    userId: string,
    projectId: string,
    file: Express.Multer.File,
  ) {
    const project = await this.validateProjectOwnership(userId, projectId);

    if (project.logoUrl) {
      await this.s3Service.deleteFileWithDbRecord(project.logoUrl);
    }

    const { url } = await this.s3Service.uploadFile(
      file,
      `project-logos/${projectId}`,
      userId,
    );

    return this.prisma.project.update({
      where: { primarykey: projectId },
      data: { logoUrl: url },
    });
  }

  private async validateProjectOwnership(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { primarykey: projectId },
    });

    if (!project) throw new NotFoundException('Проект не найден');
    if (project.createdBy !== userId)
      throw new ForbiddenException('Доступ запрещен');

    return project;
  }

  //Milestones
  async getByProject(projectId: string) {
    return this.prisma.milestone.findMany({
      where: { projectId },
      orderBy: { date: 'asc' },
    });
  }

  async create(projectId: string, dto: CreateMilestoneDto) {
    // убедимся, что проект существует
    const project = await this.prisma.project.findUnique({
      where: { primarykey: projectId },
    });
    if (!project) throw new NotFoundException('Проект не найден');

    return this.prisma.milestone.create({
      data: {
        projectId,
        title: dto.title,
        description: dto.description,
        date: new Date(dto.date),
        dateEnd: new Date(dto.dateEnd),
        status: dto.status,
      },
    });
  }

  async update(id: string, dto: UpdateMilestoneDto) {
    const exists = await this.prisma.milestone.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Веха не найдена');

    return this.prisma.milestone.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        date: dto.date ? new Date(dto.date) : undefined,
        dateEnd: dto.dateEnd ? new Date(dto.dateEnd) : undefined,
        status: dto.status,
      },
    });
  }

  async delete(id: string) {
    const exists = await this.prisma.milestone.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Веха не найдена');

    await this.prisma.milestone.delete({ where: { id } });
    return { deleted: true };
  }
}
