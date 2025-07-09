// src/types/chat.ts
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  login?: string;
  email?: string;
  avatarUrl?: string;
}

export interface Chat {
  primarykey: string;
  title: string;
  isPrivate: boolean;
  members: Array<{
    accountRef: User;
  }>;
  messages: Array<{
    account?: User;
    accountRef?: User;
    content: string;
    createdAt: Date;
  }>;
  account?: string;
}

export interface Message {
  id: string;
  content: string;
  account: User;
  createdAt: string;
}