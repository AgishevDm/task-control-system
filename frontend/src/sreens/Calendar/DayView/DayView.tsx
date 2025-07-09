import React, { useEffect, useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import Event from '../Event/Event';
import './DayView.scss';
import { CalendarEvent } from '../../../types/calendar';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const DayView: React.FC<DayViewProps> = ({ currentDate, events, onEventClick }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const generateTimeSlots = () => {
    return [...Array(24)].map((_, hour) => (
      <div key={hour} className="time-slot">
        <span className="time-label">{`${hour.toString().padStart(2, '0')}:00`}</span>
        <div className="grid-line"></div>
      </div>
    ));
  };

  const calculateEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    
    return {
      top: (startMinutes / 1440) * 100,
      height: ((endMinutes - startMinutes) / 1440) * 100
    };
  };

  const dayEvents = events.filter(e => isSameDay(e.start, currentDate));

  return (
    
    <div className="day-view">
      <div className="time-column">{generateTimeSlots()}</div>
    
      <div className="day-content">
         {/* Time indicator line */}
         <div className="time-indicator" 
             style={{ top: `${((currentTime.getHours() * 60 + currentTime.getMinutes()) / 1400) * 100}%` }}>
          <div className="time-line"></div>
          <div className="time-circle"></div>
        </div>

        {/* Events */}
        {dayEvents.map(event => {
          const { top, height } = calculateEventPosition(event);
          return (
            <div 
              key={event.id}
              className="day-event"
              style={{
                top: `${top-0.5}%`,
                height: `${height}%`,
                left: '10%',
                right: '2%',
               // backgroundColor: event.color,
              }}
              onClick={() => onEventClick(event)}
            >
              <Event 
                event={event} 
                isCompact 
                showTime={false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DayView;