import React, { useRef, useEffect, useState } from 'react';
import Calendar, { CalendarProps } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarSection.scss';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface TaskEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  color: string;
}

const ROW_HEIGHT = 60; 
const CONTAINER_HEIGHT = 280;

const CalendarSection: React.FC = () => {
  const [value, onChange] = useState<Value>(new Date());
  const timelineRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  const [tasks] = useState<TaskEvent[]>([
    {
      id: 1,
      title: 'Совещание',
      start: new Date(new Date().setHours(10, 0)),
      end: new Date(new Date().setHours(11, 30)),
      color: '#0984e3'
    },
    {
      id: 2,
      title: 'Обед',
      start: new Date(new Date().setHours(13, 0)),
      end: new Date(new Date().setHours(14, 0)),
      color: '#00b894'
    }
  ]);

  // Инициализация скролла
  useEffect(() => {
    if (timelineRef.current && !initialScrollDone) {
      const minutes = new Date().getHours() * 60+ new Date().getMinutes();
      timelineRef.current.scrollTop = minutes - CONTAINER_HEIGHT/3;
      setInitialScrollDone(true);
    }
  }, [initialScrollDone]);

  // Обновление времени
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const renderHours = () => {
    return Array.from({ length: 24 }).map((_, hour) => (
      <div 
        key={hour} 
        className="hour-row" 
        style={{ height: ROW_HEIGHT }}
      >
        <span className="hour-label">
          {hour.toString().padStart(2, '0')}:00
        </span>
      </div>
    ));
  };

  const calculateTaskPosition = (date: Date) => {
    return date.getHours() * ROW_HEIGHT + date.getMinutes();
  };

  return (
    <div className="calendar-section">
      <Calendar
        onChange={(val) => onChange(val)}
        value={value}
        locale="ru-RU"
        next2Label={null}
        prev2Label={null}
      />

      <div 
        className="timeline-container"
        ref={timelineRef}
      >
        <div 
          className="time-marker"
          style={{
            top: currentTime.getHours() * ROW_HEIGHT+20 + currentTime.getMinutes()
          }}
          data-time={currentTime.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        />
        <div className="hours-wrapper">
          {renderHours()}
        </div>

        {tasks.map(task => {
          const top = calculateTaskPosition(task.start);
          const height = calculateTaskPosition(task.end) - top;
          
          return (
            <div
              key={task.id}
              className="task-event"
              style={{
                top: top,
                height: height,
                backgroundColor: task.color
              }}
            >
              {task.title}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarSection;