export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  date: string;          // ISO date string
  dateEnd: string;
  status: 'Planned' | 'Achieved' | 'Missed';
  createdAt: string;     // ISO timestamp
  updatedAt: string;     // ISO timestamp
}