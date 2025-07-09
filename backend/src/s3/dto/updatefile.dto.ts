import { IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  file: Express.Multer.File;

  @IsOptional()
  @IsString()
  parentId?: string;
}
