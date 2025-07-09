import {
  IsString,
  IsOptional,
  IsIn,
  IsISO8601,
  IsArray,
  ValidateNested,
  IsUUID,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

const allowedStatuses = ['В работе', 'Завершен', 'Приостановлен'] as const;

export class ProjectMemberDto {
  @IsOptional()
  @IsUUID()
  tempId?: string;

  @IsOptional()
  @IsUUID()
  primarykey?: string;

  @IsUUID()
  accountId: string;

  @IsArray()
  role: {
    name: string;
  };

  @IsOptional()
  @IsUUID()
  assignedById?: string;
}

export class Roles {
  @IsString()
  name: string;
}

export class ProjectTeamDto {
  // @IsOptional()
  // @IsUUID()
  // tempId?: string;

  @IsOptional()
  @IsUUID()
  primarykey: string;

  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamMember)
  members: TeamMember[];
}

export class TeamMember {
  @IsOptional()
  @IsUUID()
  primarykey: string;

  @IsObject()
  role: string;

  @IsString()
  accountId: string;

  @IsString()
  teamId: string;

  @IsISO8601()
  joinedAt: Date;
}

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsISO8601()
  startDate: string;

  @IsISO8601()
  endDate: string;

  @IsOptional()
  @IsIn(allowedStatuses)
  status?: (typeof allowedStatuses)[number];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectMemberDto)
  ProjectMember: ProjectMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectTeamDto)
  teams: ProjectTeamDto[];
}

import { PartialType } from '@nestjs/mapped-types';
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
