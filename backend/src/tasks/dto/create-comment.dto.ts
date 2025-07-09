import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsOptional()
  @IsArray()
  files?: Express.Multer.File[];
}
