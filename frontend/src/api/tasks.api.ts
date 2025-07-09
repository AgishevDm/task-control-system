import apiClient from './client';
import { Task, Comment, FileAttachment } from '../types/task';

export const TasksApi = {
  async getAllTasks(projectId?: string): Promise<Task[]> {
    try {
      const response = await apiClient.get('/tasks', { 
        params: { projectId } 
      });
      return response.data.map(this.mapTask);
    } catch (error) {
      this.handleError(error, 'Ошибка загрузки задач');
      throw error;
    }
  },

  async getProjectTasks(projectId?: string): Promise<Task[]> {
    try {
      console.log(projectId)
      const response = await apiClient.get(`/tasks/project/${projectId}`);
      return response.data.map(this.mapTask);
    } catch (error) {
      this.handleError(error, 'Ошибка загрузки задач');
      throw error;
    }
  },

  async getTaskById(id: string): Promise<Task> {
    try {
      const response = await apiClient.get(`/tasks/${id}`);
      return this.mapTask(response.data);
    } catch (error) {
      this.handleError(error, `Ошибка загрузки задачи ${id}`);
      throw error;
    }
  },

  async createTask(taskData: Omit<Task, 'primarykey' | 'number'>): Promise<Task> {
    try {
      const response = await apiClient.post('/tasks', this.normalizeTaskData(taskData));
      return this.mapTask(response.data);
    } catch (error) {
      this.handleError(error, 'Ошибка создания задачи');
      throw error;
    }
  },

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
    try {
      const response = await apiClient.patch(`/tasks/${id}`, this.normalizeTaskData(taskData));
      return this.mapTask(response.data);
    } catch (error) {
      this.handleError(error, `Ошибка обновления задачи ${id}`);
      throw error;
    }
  },

  async deleteTask(id: string): Promise<void> {
    try {
      await apiClient.delete(`/tasks/${id}`);
    } catch (error) {
      this.handleError(error, `Ошибка удаления задачи ${id}`);
      throw error;
    }
  },

  async getComments(taskId: string): Promise<Comment[]> {
    try {
      const response = await apiClient.get(`/tasks/${taskId}/comments`);
      const check = response.data;
      const a = response.data.map(this.mapComment);
      console.log('a - ', a)
      console.log(check)
      return response.data.map(this.mapComment);
    } catch (error) {
      this.handleError(error, `Ошибка загрузки комментариев для задачи ${taskId}`);
      throw error;
    }
  },

  async addComment(taskId: string, text: string, files: File[]): Promise<Comment> {
    try {
      const formData = new FormData();
      formData.append('comment', text);
      files.forEach(file => formData.append('files', file));

      const response = await apiClient.post(
        `/tasks/${taskId}/comments`,
        formData,
        {
          headers:{ 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            // Можно обновлять прогресс загрузки
          }
        }
      );
      return this.mapComment(response.data);
    } catch (error) {
      this.handleError(error, 'Ошибка добавления комментария');
      throw error;
    }
  },

  async updateComment(taskId: string, commentId: string, text: string, files: File[]): Promise<Comment> {
    try {
      const formData = new FormData();
      formData.append('comment', text);
      files.forEach(file => formData.append('files', file));

      const response = await apiClient.patch(`/tasks/${taskId}/comments/${commentId}`, formData);
      return this.mapComment(response.data);
    } catch (error) {
      this.handleError(error, 'Ошибка обновления комментария');
      throw error;
    }
  },

  async deleteComment(taskId: string, commentId: string): Promise<void> {
    try {
      await apiClient.delete(`/tasks/${taskId}/comments/${commentId}`);
    } catch (error) {
      this.handleError(error, 'Ошибка удаления комментария');
      throw error;
    }
  },

  mapTask: (task: any): Task => {
    return {
      ...task,
      startDate: new Date(task.startDate),
      endDate: new Date(task.endDate),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      assignee: task.assignedToRef ? {
        id: task.assignedToRef.primarykey, // Добавляем ID
        name: task.assignedToRef.name || 'Не назначено',
        avatar: task.assignedToRef.avatarUrl
      } : { id: '', name: 'Не назначено' },
      attachments: (task.attachments || []).map(TasksApi.mapFile) // Используем прямое обращение
    };
  },
  mapComment: (comment: any): Comment => {
    return {
      id: comment.primarykey,
      author: {
        id: comment.account?.primarykey || '',
        name: `${comment.account?.firstName} ${comment.account?.lastName}` || 'Аноним',
        avatar: comment.account?.avatarUrl || `${comment.account?.firstName[0]} ${comment.account?.lastName[0]}`
      },
      text: comment.comment,
      date: new Date(comment.createdAt),
      editDate: new Date(comment.updatedAt),
      files: (comment.CommentAttachment || []).map(TasksApi.mapFile),
      isEdited: comment.updatedAt !== comment.createdAt
    };
  },

  mapFile: (file: any): FileAttachment => {
    console.log('aaa a a  ', file.mimeType)
    return {
      id: file.primarykey,
      name: file.file.filename,
      url: file.file.path,
      rawSize: file.file.size,
      size: TasksApi.formatSize(file.file.size),
      type: file.file.mimeType,
      createdAt: new Date(file.createdAt)
    };
  },

  normalizeTaskData(taskData: Partial<Task>): any {
    return {
      ...taskData,
      startDate: taskData.startDate?.toISOString(),
      endDate: taskData.endDate?.toISOString(),
      dueDate: taskData.dueDate?.toISOString(),
    };
  },

  formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const exp = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, exp);
    return `${size.toFixed(1)} ${units[exp]}`;
  },

  handleError(error: unknown, message: string): void {
    console.error(`${message}:`, error);
    // Можно добавить обработчик для показа уведомлений
  }
};