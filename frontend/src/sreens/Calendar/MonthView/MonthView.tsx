import React from 'react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import Event from '../Event/Event';
import './MonthView.scss';
import { CalendarEvent } from '../../../types/calendar';

interface MonthViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
}

const MonthView: React.FC<MonthViewProps> = ({ currentDate, events, onEventClick }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const dayEvents = events.filter(e => isSameDay(day, e.start));
      days.push(
        <div key={day.toString()} className={`calendar-day ${!isSameMonth(day, monthStart) ? 'other-month' : ''}`}>
          <div className="day-header">
            {format(day, 'd')}
            {isSameDay(day, new Date()) && <div className="today-marker"></div>}
          </div>
          <div className="day-events">
            {dayEvents.map(event => (
              <Event 
                key={event.id} 
                event={event} 
                isCompact 
                showTime={false}
                onClick={() => onEventClick(event)}
              />
            ))}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(<div key={day.toString()} className="calendar-row">{days}</div>);
    days = [];
  }

  return <div className="month-view">{rows}</div>;
};

export default MonthView;