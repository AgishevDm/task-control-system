import apiClient from './client';
import { CalendarEvent, Attendee } from '../types/calendar';

export const CalendarApi = {
  async getAllEvents(): Promise<CalendarEvent[]> {
    try {
      const response = await apiClient.get<CalendarEvent[]>('/calendar');
      return response.data.map(this.mapEvent);
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new Error('Failed to fetch events');
    }
  },

  async getEventById(id: string): Promise<CalendarEvent> {
    const response = await apiClient.get(`/calendar/events/${id}`);
    return this.mapEvent(response.data);
  },

  async createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    try {
      const response = await apiClient.post<CalendarEvent>(
        '/calendar',
        this.prepareEventData(event)
      );
      return this.mapEvent(response.data);
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event');
    }
  },

  async updateEvent(id: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const response = await apiClient.patch(`/calendar/${id}`, this.prepareEventData(event));
    return this.mapEvent(response.data);
  },

  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`/calendar/${id}`);
  },

  prepareEventData(event: Partial<CalendarEvent>): any {
    const safeDate = (date: any) => {
      if (date instanceof Date) return date;
      if (typeof date === 'string') return new Date(date);
      return null;
    };

    console.log(event)

    return {
      ...event,
    start: safeDate(event.start)?.toISOString(),
    end: safeDate(event.end)?.toISOString(),
    dueDate: event.dueDate ? safeDate(event.dueDate)?.toISOString() : undefined,
    attendees: Array.isArray(event.attendees) 
      ? event.attendees
          .filter(a => a !== null && a !== undefined)
          .map(a => {
            if (typeof a === 'string') return a;
            if (a && 'primarykey' in a) return a.primarykey;
            return null;
          })
          .filter(a => a !== null)
      : undefined
    };
  },

  mapEvent(event: any): CalendarEvent {
    return {
      ...event,
      attendees: (event.attendees || [])
        .filter((a: any) => a !== null)
        .map((a: any) => ({
          id: a.id,
          login: a.login,
          email: a.email,
          firstName: a.firstName || '',
          lastName: a.lastName || '',
          avatarUrl: a.avatarUrl
        }))
    };
  }
};