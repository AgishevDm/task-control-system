import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AttachmentDto {
  @IsString()
  fileId: string;

  @IsString()
  fileName: string;

  @IsString()
  fileType: string;

  @IsString()
  fileSize: number;
}

export class SendMessageDto {
  @IsString()
  chatId: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  @IsOptional()
  attachments?: AttachmentDto[];

  @IsString()
  accountPrimaryKey: string;
}
