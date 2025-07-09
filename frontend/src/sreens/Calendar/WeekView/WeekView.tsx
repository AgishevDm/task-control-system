import React from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import Event from '../Event/Event';
import './WeekView.scss';
import { CalendarEvent } from '../../../types/calendar';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ currentDate, events, onEventClick }) => {
  return (
    <div className="week-view">
      <div className="days-container">
        {[...Array(7)].map((_, i) => {
          const day = addDays(startOfWeek(currentDate), i);
          return (
            <div key={i} className="day-column">
              <div className="day-header">
                <span className="day-name">{format(day, 'EEEEEE', { locale: ru })}</span>
                <span className="day-number">{format(day, 'd')}</span>
              </div>
              <div className="events-container">
                {events
                  .filter(e => isSameDay(e.start, day))
                  .map(event => (
                    <Event
                      key={event.id}
                      event={event}
                      onClick={() => onEventClick(event)}
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekView;