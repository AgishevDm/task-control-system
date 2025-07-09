import { Calendar, Account } from '@prisma/client';

export interface AttendeeDto {
  primarykey: string;
  login: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface CalendarEventDto {
  id: string;
  title: string;
  start: Date | null;
  end: Date | null;
  type: string;
  color: string;
  description?: string | null;
  priority?: string | null;
  dueDate?: Date | null;
  attendees?: AttendeeDto[];
}

export type CalendarWithAttendees = Calendar & {
  attendeesCalendar?: Array<{
    account: Pick<
      Account,
      'primarykey' | 'login' | 'email' | 'firstName' | 'lastName' | 'avatarUrl'
    >;
  }>;
};
