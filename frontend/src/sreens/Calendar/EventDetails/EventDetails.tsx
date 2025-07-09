import React from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import './EventDetails.scss';
import { CalendarEvent, Attendee } from '../../../types/calendar';

interface EventDetailsProps {
  event: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ 
  event, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete 
}) => {
  if (!isOpen) return null;

  const formatTime = (date: Date) => format(date, 'HH:mm, d MMMM yyyy', { locale: ru });

  return (
    <div className="event-details-modal">
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content">
        <h3>{event.title}</h3>

        <div className="event-info">
          <div className="info-row">
            <span className="label">Тип:</span>
            <span className="value" style={{ color: event.color }}>
              {event.type}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Начало:</span>
            <span className="value">{formatTime(event.start)}</span>
          </div>
          <div className="info-row">
            <span className="label">Окончание:</span>
            <span className="value">{formatTime(event.end)}</span>
          </div>
          {event.description && (
            <div className="info-row">
              <span className="label">Описание:</span>
              <span className="value">{event.description}</span>
            </div>
          )}
          {event.priority && (
            <div className="info-row">
              <span className="label">Приоритет:</span>
              <span className="value">{event.priority}</span>
            </div>
          )}
          {event.attendees && event.attendees.length > 0 && (
            <div className="info-row">
              <span className="label">Участники:</span>
              <div className="attendees-list">
                {event.attendees.map(attendee => (
                  <div key={attendee.primarykey} className="attendee">
                    {attendee.avatarUrl && (
                      <img 
                        src={attendee.avatarUrl} 
                        alt={attendee.login} 
                        className="attendee-avatar"
                      />
                    )}
                    <span className="attendee-name">
                      {attendee.firstName || attendee.lastName 
                        ? `${attendee.firstName} ${attendee.lastName}`
                        : attendee.login}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="danger-btn" onClick={onDelete}>
            Удалить
          </button>
          <div>
            <button className="cancel-btn" onClick={onClose}>
              Закрыть
            </button>
            <button 
              className="submit-btn" 
              onClick={() => onEdit(event)}
            >
              Редактировать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;