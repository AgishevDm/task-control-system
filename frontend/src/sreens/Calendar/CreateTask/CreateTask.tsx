import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import './CreateTask.scss';
import { MdTask, MdEvent, MdPeople, MdNotifications } from 'react-icons/md';
import { CalendarEvent, Attendee, User } from '../../../types/calendar';
import UserSearchInput from '../../../components/UserSearchInput';

export type EventType = 'task' | 'event' | 'meeting' | 'reminder';

interface CreateTaskProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: Omit<CalendarEvent, 'id'> & { id?: string }) => Promise<void>;
  initialEvent?: CalendarEvent;
  mode: 'create' | 'edit';
}

const CreateTask: React.FC<CreateTaskProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialEvent,
  mode
}) => {
  const [selectedType, setSelectedType] = useState<EventType>('event');
  const [title, setTitle] = useState(initialEvent?.title || '');
  const [start, setStart] = useState(initialEvent?.start || new Date());
  const [end, setEnd] = useState(initialEvent?.end  || new Date());
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [attendees, setAttendees] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const eventTypes = [
    { type: 'task', label: 'Задача', icon: <MdTask /> },
    { type: 'event', label: 'Событие', icon: <MdEvent /> },
    { type: 'meeting', label: 'Совещание', icon: <MdPeople /> },
    { type: 'reminder', label: 'Напоминание', icon: <MdNotifications /> },
  ];
  const [selectedAttendees, setSelectedAttendees] = useState<Attendee[]>([]);
  
  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title);
      setStart(initialEvent.start);
      setEnd(initialEvent.end);
      setSelectedType(initialEvent.type as EventType);
      setSelectedColor(initialEvent.color);
      setDescription(initialEvent.description || '');
      setPriority(initialEvent.priority || 'medium');
      setDueDate(initialEvent.dueDate || undefined);
      setSelectedAttendees(initialEvent.attendees || []);
    } else if (!initialEvent && mode === 'create') {
      resetForm();
    }
  }, [initialEvent]);

  const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const handleSubmit = () => {
    if (end < start) {
      alert('Дата окончания не может быть раньше даты начала');
      return;
    }

    console.log(selectedAttendees)

    if (selectedType === 'meeting' && selectedAttendees.length === 0) {
      alert('Выберите хотя бы одного участника для совещания');
      return;
    }

    const eventData = {
      title,
      start,
      end,
      type: selectedType,
      color: selectedColor,
      description: description || undefined,
      priority: selectedType === 'task' ? priority : undefined,
      dueDate: selectedType === 'task' ? dueDate : undefined,
      attendees: selectedType === 'meeting' ? selectedAttendees : undefined
    };

    onSubmit(mode === 'edit' 
      ? { ...eventData, id: initialEvent!.id } 
      : eventData
    );
  };

  const handleSelectUser = (user: User) => {
    if (!user) return;

    if (!selectedAttendees.some(u => u.primarykey === user.primarykey)) {
      setSelectedAttendees([...selectedAttendees, {
        primarykey: user.primarykey,
        login: user.login,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl
      }]);
    }
  };

  const resetForm = () => {
    setTitle('');
    setStart(new Date());
    setEnd(new Date());
    setDescription('');
    setPriority('medium');
    setDueDate(undefined);
    setAttendees('');
    setSelectedColor('#6366f1');
    setSelectedType('event');
    setSelectedAttendees([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedAttendees(selectedAttendees.filter(u => u.primarykey !== userId));
  };

  if (!isOpen) return null;

  return (
    <div className="create-task-modal">
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content">
        <h3>Создание нового элемента</h3>
        
        <div className="type-selector">
          {eventTypes.map(({ type, label, icon }) => (
            <button
              key={type}
              className={selectedType === type ? 'active' : ''}
              onClick={() => setSelectedType(type as EventType)}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        <div className="color-picker">
          {colors.map(color => (
            <div
              key={color}
              className={`color-option ${selectedColor === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>

        <input
          type="text"
          placeholder="Название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="time-pickers">
          <input
            type="datetime-local"
            value={format(start, "yyyy-MM-dd'T'HH:mm")}
            onChange={(e) => {
              const date = parseISO(e.target.value);
              setStart(date);
            }}
          />

          <input
            type="datetime-local"
            value={format(end, "yyyy-MM-dd'T'HH:mm")}
            onChange={(e) => {
              const date = parseISO(e.target.value);
              setEnd(date);
            }}
          />
        </div>

        {selectedType === 'task' && (
          <div className="additional-fields">
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Низкий приоритет</option>
              <option value="medium">Средний приоритет</option>
              <option value="high">Высокий приоритет</option>
            </select>
            <input
              type="date"
              value={dueDate ? format(dueDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => setDueDate(parseISO(e.target.value))}
            />
          </div>
        )}

        {selectedType === 'meeting' && (
          <div className="additional-fields">
            <label>Участники:</label>
              <UserSearchInput
                selectedUsers={selectedAttendees}
                onSelect={(user) => user && handleSelectUser(user)}
                onRemove={handleRemoveUser}
              />
          </div>
        )}

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Отмена
          </button>
          <button className="submit-btn" onClick={handleSubmit}>
            {mode === 'edit' ? 'Обновить' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTask;