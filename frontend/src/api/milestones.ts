import apiClient from './client';
import { Milestone } from '../types/milestone';
import { Task as TaskType, Comment, FileAttachment } from '../types/task';

export const MilestonesApi = {
  /**
   * Получить все вехи по проекту
   */
  async getByProject(projectId: string): Promise<Milestone[]> {
    const response = await apiClient.get<Milestone[]>(`/projects/${projectId}/milestones`);
    return response.data;
  },

  /**
   * Создать новую веху
   */
  async create(payload: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>): Promise<Milestone> {
    const response = await apiClient.post<Milestone>(`/projects/${payload.projectId}/milestones`, payload);
    return response.data;
  },

  /**
   * Обновить существующую веху
   */
  async update(id: string, payload: Partial<Omit<Milestone, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>): Promise<Milestone> {
    const response = await apiClient.patch<Milestone>(`projects/milestones/${id}`, payload);
    return response.data;
  },

  async getByMilestone(milestoneId: string): Promise<TaskType[]> {
    const response = await apiClient.get<TaskType[]>(`projects/milestones/${milestoneId}/tasks`);
    return response.data;
  },

  /**
   * Удалить веху по ID
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`projects/milestones/${id}`);
  }
};