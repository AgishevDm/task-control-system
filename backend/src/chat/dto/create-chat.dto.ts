import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateChatDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  memberIds: string[];
}
