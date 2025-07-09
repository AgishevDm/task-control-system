import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MdTask, MdEvent, MdPeople, MdNotifications, MdExpandMore } from 'react-icons/md';
import './Event.scss';
import { CalendarEvent, Attendee } from '../../../types/calendar';


interface EventProps {
  event: CalendarEvent;
  showTime?: boolean;
  isCompact?: boolean;
  onClick?: () => void;
}

const Event: React.FC<EventProps> = ({ event, showTime = true, isCompact = false, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    const eventRef = useRef<HTMLDivElement>(null);

    const getEventIcon = () => {
      switch(event.type) {
        case 'task': return <MdTask className="event-icon"/>;
        case 'reminder': return <MdNotifications className="event-icon"/>;
        case 'meeting': return <MdPeople className="event-icon"/>;
        default: return <MdEvent className="event-icon"/>;
      }
    };

    const getEventTypeName = () => {
      switch(event.type) {
        case 'task': return 'Задача';
        case 'reminder': return 'Напоминание';
        case 'meeting': return 'Совещание';
        default: return 'Событие';
      }
    };

    const getPriorityName = () => {
      switch(event.priority) {
        case 'high': return 'Высокий';
        case 'medium': return 'Средний';
        case 'low': return 'Низкий';
        default: return '';
      }
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onClick) onClick();
    };

    return (
      <div 
        className={`calendar-event ${isHovered ? 'expanded' : ''}`}
        ref={eventRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Компактное отображение */}
        <div className="compact-view" style={{ backgroundColor: event.color }}>
          <div className="event-icon-container">
            {getEventIcon()}
          </div>
          <div className="event-time">
            {format(event.start, 'HH:mm')}
          </div>
          <div className="event-title" title={event.title}>
            {event.title.length > 12 ? `${event.title.substring(0, 12)}...` : event.title}
          </div>
          <MdExpandMore className="expand-icon" />
        </div>

        {/* Развернутое отображение */}
        {isHovered && (
          <div 
            className="expanded-view"
            style={{ 
              backgroundColor: event.color,
              borderColor: event.color
            }}
          >
            <div className="event-header">
              <div className="event-type">
                {getEventIcon()}
                <span>{getEventTypeName()}</span>
              </div>
              <div className="event-datetime">
                <div className="time-block">
                  <span className="time-label">Начало:</span>
                  <span className="time-value">
                    {format(event.start, 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </span>
                </div>
                <div className="time-block">
                  <span className="time-label">Окончание:</span>
                  <span className="time-value">
                    {format(event.end, 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </span>
                </div>
              </div>
            </div>

            <div className="event-content">
              <h4 className="event-title">{event.title}</h4>
              
              {event.description && (
                <div className="event-description-container">
                  <p className="event-description">
                    {event.description}
                  </p>
                </div>
              )}

              <div className="event-details">
                {event.type === 'task' && event.priority && (
                  <div className="detail-row">
                    <span className="detail-label">Приоритет:</span>
                    <span className={`detail-value priority-${event.priority}`}>
                      {getPriorityName()}
                    </span>
                  </div>
                )}

                {event.type === 'task' && event.dueDate && (
                  <div className="detail-row">
                    <span className="detail-label">Срок:</span>
                    <span className="detail-value">
                      {format(event.dueDate, 'dd.MM.yyyy', { locale: ru })}
                    </span>
                  </div>
                )}

                {event.type === 'meeting' && event.attendees && event.attendees.length > 0 && (
                  <div className="detail-row">
                    <span className="detail-label">Участники:</span>
                    <div className="attendees-preview">
                      {event.attendees.slice(0, 3).map(attendee => (
                        <div key={attendee.primarykey} className="attendee-badge">
                          {attendee.avatarUrl ? (
                            <img 
                              src={attendee.avatarUrl} 
                              alt={attendee.login} 
                              className="avatar-xs"
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {attendee.login.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))}
                      {event.attendees.length > 3 && (
                        <div className="more-attendees">+{event.attendees.length - 3}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
};

export default Event;