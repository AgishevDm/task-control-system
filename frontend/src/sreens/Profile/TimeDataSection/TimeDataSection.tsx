import React from 'react';
import './TimeDataSection.scss';

const TimeDataSection: React.FC = () => {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => 
    date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (date: Date) => 
    date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric'
    });

  return (
    <div className="time-data-section">
      <div className="time-display">{formatTime(time)}</div>
      <div className="date-display">{formatDate(time)}</div>
    </div>
  );
};

export default TimeDataSection;