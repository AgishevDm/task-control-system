import { projectRoles, teamRoles } from "../enum/projectRoles";

export interface Participant {
  primarykey: string;
  name: string;
  avatar?: string;
}

export type ProjectStatus = 'В работе' | 'Завершен' | 'Приостановлен';

export interface Project {
  primarykey: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  logoUrl?: string | null;
  createdAt: string;
  createdBy: string;
  ProjectMember: ProjectMember[];
  teams: Team[];
}

export interface ProjectMember {
  primarykey: string;
  accountId: string;
  role: rolesName;
  assignedById?: string;
  assignedAt?: string;
  account: User;
}

export interface rolesName {
  name: projectRoles;
}

export interface TeamMember {
  primarykey: string;
  accountId: string;
  role: teamRoles;
  account: User;
  joinedAt?: string;
  teamId?: string;
}

export type StatusBadgeProps = {
  status: ProjectStatus;
};

export type ParticipantsAvatarsProps = {
  participants: Participant[];
};

export interface Team {
  primarykey: string;
  name: string;
  members: TeamMember[];
  projectId: string;
}

export interface User {
  primarykey: string;
  firstName: string;
  lastName: string;
  login: string;
  email: string;
  avatarUrl?: string;
}

export { teamRoles, projectRoles };
