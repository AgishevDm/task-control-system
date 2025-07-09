import React, { useEffect, useState } from 'react';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import './Calendar.scss';
import MonthView from './MonthView/MonthView';
import WeekView from './WeekView/WeekView';
import DayView from './DayView/DayView';
import CreateTask from './CreateTask/CreateTask';
import EventDetails from './EventDetails/EventDetails';
import Event from './Event/Event';
import { CalendarEvent, Attendee } from '../../types/calendar';
import { CalendarApi } from '../../api/calendar';



const Calendar = () => {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleEditClick = () => {
    setShowModal(true);
    setShowDetailsModal(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const events = await CalendarApi.getAllEvents();
      setEvents(events);
    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
    }
  };

  // Обработчик клика по событию
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  // Удаление события
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      await CalendarApi.deleteEvent(selectedEvent.id);
      setEvents(events.filter(e => e.id !== selectedEvent.id));
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Ошибка удаления события:', error);
    }
  };

  // Редактирование события
  const handleEditEvent = async (updatedEvent: Omit<CalendarEvent, 'id'> & { id: string }) => {
    try {
      // Добавим явное преобразование дат
      const eventWithDates = {
        ...updatedEvent,
        start: new Date(updatedEvent.start),
        end: new Date(updatedEvent.end),
        dueDate: updatedEvent.dueDate ? new Date(updatedEvent.dueDate) : undefined
      };
      
      const event = await CalendarApi.updateEvent(
        updatedEvent.id,
        eventWithDates
      );
      setEvents(events.map(e => e.id === event.id ? event : e));
      setShowModal(false);
    } catch (error) {
      console.error('Ошибка обновления события:', error);
    }
  };

  // Добавление нового события
  const handleAddEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    try {
      const createdEvent = await CalendarApi.createEvent(event);
      setEvents([...events, createdEvent]);
      setShowModal(false);
    } catch (error) {
      console.error('Ошибка создания события:', error);
    }
  };

  return (
    <div className="calendar-container">
      <div className="calendar-toolbar">
        <div className="view-controls">
          <button 
            className={viewMode === 'month' ? 'active' : ''}
            onClick={() => setViewMode('month')}
          >
            Месяц
          </button>
          <button 
            className={viewMode === 'week' ? 'active' : ''}
            onClick={() => setViewMode('week')}
          >
            Неделя
          </button>
          <button 
            className={viewMode === 'day' ? 'active' : ''}
            onClick={() => setViewMode('day')}
          >
            День
          </button>
        </div>
        
        <div className="date-navigation">
          <button onClick={() => setCurrentDate(addDays(currentDate, -7))}>←</button>
          <h2>{format(currentDate, 'MMMM yyyy', { locale: ru })}</h2>
          <button onClick={() => setCurrentDate(addDays(currentDate, 7))}>→</button>
        </div>

        <button 
          className="add-event-btn"
            onClick={() => {
              setSelectedEvent(null);
              setShowModal(true);
            }}
        >
          + Создать событие
        </button>
      </div>

      <div className={`calendar-body ${viewMode}-view`}>
        {viewMode === 'month' ? (
          <MonthView 
            currentDate={currentDate} 
            events={events} 
            onEventClick={handleEventClick}
          />
        ) : viewMode === 'week' ? (
          <WeekView 
            currentDate={currentDate} 
            events={events} 
            onEventClick={handleEventClick}
          />
        ) : (
          <DayView 
            currentDate={currentDate} 
            events={events} 
            onEventClick={handleEventClick}
          />
        )}
      </div>

      <CreateTask
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedEvent(null);
        }}
        onSubmit={async (event) => {
          if (selectedEvent) {
            await handleEditEvent({ ...event, id: selectedEvent.id });
          } else {
            await handleAddEvent(event);
          }
        }}
        initialEvent={selectedEvent || undefined}
        mode={selectedEvent ? 'edit' : 'create'}
      />

      <EventDetails
        event={selectedEvent!}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onEdit={handleEditClick}
        onDelete={handleDeleteEvent}
      />

    </div>
  );
};

export default Calendar;