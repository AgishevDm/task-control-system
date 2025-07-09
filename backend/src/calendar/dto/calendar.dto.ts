// create-event.dto.ts
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateEventDto {
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsDateString()
  start: Date;

  @IsOptional()
  @IsDateString()
  end?: Date;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  color: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsArray()
  @IsString({ each: true })
  attendees: string[];
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}
