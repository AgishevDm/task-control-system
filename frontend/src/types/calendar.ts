export interface Attendee extends User {}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: string;
  color: string;
  description?: string;
  priority?: string;
  dueDate?: Date;
  attendees?: Attendee[];
}

export interface User {
  primarykey: string;
  firstName: string;
  lastName: string;
  login: string;
  email: string;
  avatarUrl?: string;
}