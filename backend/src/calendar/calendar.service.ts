import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from './dto/calendar.dto';
import { Account, Calendar } from '@prisma/client';
import {
  CalendarEventDto,
  CalendarWithAttendees,
} from './types/calendar.types';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async createEvent(userId: string, createEventDto: CreateEventDto) {
    const { attendees, ...eventData } = createEventDto;

    return this.prisma.$transaction(async (prisma) => {
      const event = await prisma.calendar.create({
        data: {
          ...eventData,
          accountId: userId,
          attendeesCalendar: attendees
            ? {
                create: attendees.map((accountId) => ({
                  account: { connect: { primarykey: accountId } },
                })),
              }
            : undefined,
        },
        include: {
          attendeesCalendar: {
            include: {
              account: true,
            },
          },
        },
      });

      return this.toResponseDto(event);
    });
  }

  async getEvents(userId: string) {
    const events = await this.prisma.calendar.findMany({
      where: {
        OR: [
          { accountId: userId },
          { attendeesCalendar: { some: { accountId: userId } } },
        ],
      },
      include: {
        attendeesCalendar: {
          include: {
            account: true,
          },
        },
      },
      orderBy: {
        start: 'asc',
      },
    });

    return events.map((event) => this.toResponseDto(event));
  }

  async getEventById(id: string, userId: string) {
    const event = await this.prisma.calendar.findUnique({
      where: { primarykey: id },
      include: {
        attendeesCalendar: {
          include: {
            account: true,
          },
        },
      },
    });

    if (
      !event ||
      (event.accountId !== userId &&
        !event.attendeesCalendar.some((a) => a.accountId === userId))
    ) {
      throw new NotFoundException('Event not found');
    }

    return this.toResponseDto(event);
  }

  async updateEvent(
    id: string,
    userId: string,
    updateEventDto: UpdateEventDto,
  ) {
    return this.prisma.$transaction(async (prisma) => {
      const existingEvent = await prisma.calendar.findUnique({
        where: { primarykey: id },
      });

      if (!existingEvent || existingEvent.accountId !== userId) {
        throw new NotFoundException('Event not found');
      }

      // Проверка существования участников
      if (updateEventDto.attendees) {
        const existingUsers = await prisma.account.count({
          where: {
            primarykey: {
              in: updateEventDto.attendees,
            },
          },
        });

        if (existingUsers !== updateEventDto.attendees.length) {
          throw new NotFoundException('One or more attendees not found');
        }
      }

      const { attendees, ...eventData } = updateEventDto;

      const event = await prisma.calendar.update({
        where: { primarykey: id },
        data: {
          primarykey: eventData.id,
          title: eventData.title,
          start: eventData.start,
          end: eventData.end,
          type: eventData.type,
          color: eventData.color,
          priority: eventData.priority,
          description: eventData.description,
          dueDate: eventData.dueDate,
          attendeesCalendar: attendees
            ? {
                deleteMany: {}, // Удаляем старых участников
                create: attendees.map((accountId) => ({
                  account: { connect: { primarykey: accountId } },
                })),
              }
            : undefined,
        },
        include: {
          attendeesCalendar: {
            include: {
              account: true,
            },
          },
        },
      });

      return this.toResponseDto(event);
    });
  }

  async deleteEvent(id: string, userId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const event = await prisma.calendar.findUnique({
        where: { primarykey: id },
      });

      if (!event || event.accountId !== userId) {
        throw new NotFoundException('Event not found');
      }

      // Удаление связанных участников
      await prisma.attendeesCalendar.deleteMany({
        where: { calendarId: id },
      });

      // Удаление самого события
      return prisma.calendar.delete({
        where: { primarykey: id },
      });
    });
  }

  private toResponseDto(event: CalendarWithAttendees): CalendarEventDto {
    return {
      id: event.primarykey,
      title: event.title,
      start: event.start,
      end: event.end,
      type: event.type,
      color: event.color,
      description: event.description,
      priority: event.priority,
      dueDate: event.dueDate,
      attendees: event.attendeesCalendar?.map(({ account }) => ({
        primarykey: account.primarykey,
        login: account.login,
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        avatarUrl: account.avatarUrl || undefined,
      })),
    };
  }
}
