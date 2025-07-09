import { FileType } from '@prisma/client';

export class FileHierarchyResponseDto {
  id: string;

  name: string;

  type: FileType;

  createdAt: Date;

  updatedAt: Date;

  children?: FileHierarchyResponseDto[];

  url?: string;

  size?: number;

  mimeType?: string;

  path?: string;

  constructor(partial: Partial<FileHierarchyResponseDto>) {
    Object.assign(this, partial);
    this.children = this.children?.map((c) => new FileHierarchyResponseDto(c));
  }
}
