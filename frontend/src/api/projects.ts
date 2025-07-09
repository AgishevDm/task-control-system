import apiClient from './client';
import { Project } from '../types/project';

export const ProjectsApi = {
  async getAllProjects(): Promise<Project[]> {
    const response = await apiClient.get('/projects');
    return response.data.map((p: any) => this.mapProject(p));
  },

  async getAllUserProjects(): Promise<Project[]> {
    const response = await apiClient.get('/projects/my-memberships');
    console.log('main - ', response.data)
    return response.data.map((p: any) => this.mapProject(p));
  },

  async getProjectById(id: string): Promise<Project> {
    const response = await apiClient.get(`/projects/${id}`);
    console.log('second - ', response.data)
    return this.mapProject(response.data);
  },

  createProject: async (project: Omit<Project, 'id'>) => {
    const response = await apiClient.post('/projects', project);
    return response.data as Project;
  },

  updateProject: async (id: string, project: Partial<Project>) => {
    const response = await apiClient.patch(`/projects/${id}`, project);
    return response.data as Project;
  },

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  },

  async uploadLogo(projectId: string, file: File): Promise<Project> {
    const formData = new FormData();
    formData.append('logo', file);
    
    const response = await apiClient.post(
      `/projects/${projectId}/logo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return this.mapProject(response.data);
  },

  mapProject(project: any): Project {
    console.log(project)
    return project;
  }
};