export interface FileHierarchyResponseDto {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path?: string;
  url?: string;
  size?: number;
  mimeType?: string;
  createdAt: Date;
  updatedAt: Date;
  children?: FileHierarchyResponseDto[];
  expanded?: boolean;
}