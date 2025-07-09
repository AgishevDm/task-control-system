import apiClient from './client';
import { FileHierarchyResponseDto } from '../types/fileHierarchy';

type SharePermission = 'VIEW' | 'COMMENT' | 'EDIT';

export const FileApi = {
  async getFileTree(parentId?: string): Promise<FileHierarchyResponseDto[]> {
    const response = await apiClient.get('/file-hierarchy/tree', {
      params: { parentId }
    });
    console.log(response.data)
    console.log(response.data.map((node: any) => this.mapFileNode(node)))
    return response.data.map((node: any) => this.mapFileNode(node));
  },

  async getFileContent(id: string): Promise<string> {
    const response = await apiClient.get<{ content: string }>(
      `/file-hierarchy/content/${id}`
    );
    return response.data.content;
  },

  async updateFileContent(id: string, content: string): Promise<void> {
    await apiClient.patch(`/file-hierarchy/content/${id}`, { content });
  },

  async createFolder(dto: { name: string; parentId?: string }): Promise<FileHierarchyResponseDto> {
    const response = await apiClient.post('/file-hierarchy/folders', dto);
    return this.mapFileNode(response.data);
  },

  async uploadFile(file: File, parentId?: string): Promise<FileHierarchyResponseDto> {
    const formData = new FormData();
    
    formData.append('file', file);

    console.log(file.name)

    const response = await apiClient.post(
      '/file-hierarchy/files',
      formData,
      {
        params: { parentId },
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return this.mapFileNode(response.data);
  },

  async renameItem(id: string, newName: string): Promise<FileHierarchyResponseDto> {
    const response = await apiClient.patch(`/file-hierarchy/${id}`, { name: newName });
    return this.mapFileNode(response.data);
  },

  async moveItem(id: string, newParentId: string): Promise<FileHierarchyResponseDto> {
    const response = await apiClient.post(`/file-hierarchy/move/${id}`, {
      newParentId
    });
    return this.mapFileNode(response.data);
  },

  async deleteItem(id: string): Promise<void> {
    await apiClient.delete(`/file-hierarchy/${id}`);
  },

  async downloadFile(id: string): Promise<{ url: string; name: string }> {
    try {
      const response = await apiClient.get(`/file-hierarchy/download/${id}`, {
      validateStatus: (status) => status >= 200 && status < 400
      });
      console.log(response.data)
      return response.data;
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      throw error; // Важно пробросить ошибку для обработки в компоненте
    }
  },

  async shareFile(
    fileHierarchyId: string,
    accountId: string,
    permission: 'VIEW'|'COMMENT'|'EDIT' = 'VIEW'
  ) {
    const response = await apiClient.post(`/file-hierarchy/${fileHierarchyId}/share`, {
      accountId, permission
    });
    return response.data;
  },

  /** Отзываем доступ */
  async unshareFile(fileHierarchyId: string, accountId: string) {
    await apiClient.delete(
      `/file-hierarchy/${fileHierarchyId}/share/${accountId}`
    );
  },

  /** Дерево со всеми доступными (свои + шаренные) */
  async getFileShares(fileHierarchyId: string): Promise<{ id: string; permission: SharePermission; name: string; }[]> {
    const response = await apiClient.get<{ accountId: string; permission: string; name: string }[]>(
      `/file-hierarchy/${fileHierarchyId}/share`
    );
    // приводим к виду, который ожидает ShareModal
    return response.data.map(s => ({
      id: s.accountId,
      permission: s.permission as SharePermission,
      name: s.name,
    }));
  },

  async getSharedFiles(): Promise<FileHierarchyResponseDto[]> {
    const response = await apiClient.get('/file-hierarchy/shared-only');
    return response.data.map((node: any) => this.mapFileNode(node));
  },

  mapFileNode(node: any): FileHierarchyResponseDto {
    return {
      id: node.id,
      name: node.name,
      type: node.type.toLowerCase() as 'file' | 'folder',
      path: node.path,
      url: node.url,
      //key: node.file?.s3key,
      size: node.size,
      mimeType: node.mimeType,
      createdAt: new Date(node.createdAt),
      updatedAt: new Date(node.updatedAt),
      children: node.children ? node.children.map((n: any) => this.mapFileNode(n)) : [],
      expanded: node.type === 'folder'
    };
  }
};