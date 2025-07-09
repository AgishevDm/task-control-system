import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export enum TaskType {
  TASK = 'Задача',
  EVENT = 'Событие',
  MEETING = 'Совещание',
  REMINDER = 'Напоминание',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskType)
  type: TaskType;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  project: string;

  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsOptional()
  startDate?: Date;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsOptional()
  endDate?: Date;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsOptional()
  dueDate?: Date;

  @IsString()
  @IsOptional()
  stage?: string;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsOptional()
  @IsUUID()
  milestoneId?: string;
}

export class UpdateTaskDto extends CreateTaskDto {}
