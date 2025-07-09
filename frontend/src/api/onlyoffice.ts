import apiClient from './client';

export interface OnlyOfficeConfig {
  document: {
    fileType: string;
    key: string;
    title: string;
    url: string;
  };
  documentType: 'word' | 'cell' | 'slide';
  editorConfig: any;
  token: string;
}

export const OnlyofficeApi = {
  getConfig: async (fileKey: string, fileId: string): Promise<OnlyOfficeConfig> => {
    // роут по примеру из контроллера NestJS
    const { data } = await apiClient.get<OnlyOfficeConfig>(
      '/onlyoffice/config',
      { params: { fileKey, fileId } }
    );
    return data;
  },
};
