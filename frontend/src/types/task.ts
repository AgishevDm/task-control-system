// types/task.ts
export interface Task {
  primarykey: string;
  number: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  type: 'Задача' | 'Событие' | 'Совещание' | 'Напоминание';
  color: string;
  project: string;
  stage: string;
  startDate: Date;
  endDate: Date;
  dueDate?: Date;
  milestoneId?: string;
  commentsCount?: number;
  attachmentsCount?: number;
  attachments?: FileAttachment[];
  updatedAt?: Date;
  assigned?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  attendees?: string[];
}

export interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  text: string;
  date: Date;
  editDate?: Date,
  files: FileAttachment[];
  isEdited?: boolean;
  canEdit?: boolean;
}

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  rawSize: number;     // Размер в байтах
  size: string;        // Отформатированный размер
  type: string;        // MIME-тип
  createdAt: Date;
  preview?: string;
}

export interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  error?: string;
  status: 'pending' | 'uploading' | 'error' | 'completed';
}