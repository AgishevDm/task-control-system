import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  MdClose, 
  MdFormatBold, 
  MdFormatItalic, 
  MdFormatListNumbered, 
  MdFormatListBulleted,
  MdEdit
} from 'react-icons/md';
import './OpenTask.scss';
import TaskComments from './TaskComments';
import { TasksApi } from '../../api/tasks.api';
import { ProjectsApi } from '../../api/projects';
import { Project } from '../../types/project';
import { Task, FileAttachment } from '../../types/task';
import { FaFile, FaFileImage, FaFilePdf, FaFileAlt } from 'react-icons/fa';
import UserSearchInput from '../../components/UserSearchInput';
import { User } from '../../types/calendar';
import { Milestone } from '../../types/milestone';
import { MilestonesApi } from '../../api/milestones';
import dayjs, { Dayjs } from 'dayjs';

interface OpenTaskProps {
  isInProject?: boolean;
  taskId?: string;
  isCreating: boolean;
  projects: Project[];
  users?: User[];
  isEditing: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onEdit: () => void;
}

const FileIcon = ({ type }: { type: string }) => {
  console.log(' sd sf sf sfd sfsfd ',type)
  if (type.startsWith('image/')) return <FaFileImage size={24} />;
  if (type === 'application/pdf') return <FaFilePdf size={24} />;
  if (type.startsWith('text/')) return <FaFileAlt size={24} />;
  return <FaFile size={24} />;
};

const OpenTask: React.FC<OpenTaskProps> = ({ 
  isInProject,
  taskId,
  isCreating,
  projects,
  isEditing, 
  onClose, 
  onSave, 
  onDelete,
  onEdit
}) => {
  const [task, setTask] = useState<Task | null>(null);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'todo',
    type: 'Задача',
    color: '',
    project: '',
    stage: '',
    startDate: new Date(),
    endDate: new Date(),
    assigned: { id: '', name: '', avatarUrl: '', },
    attachments: [],
  });
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [milestones, setMilestones] = useState<Milestone[]>([])
  
  const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const statusOptions = ['todo', 'in_progress', 'done'];
  const priorityOptions = ['low', 'medium', 'high'];
  const typeOptions = ['Задача', 'Событие', 'Совещание', 'Напоминание'];
  const projectOptions = ['Веб-сайт', 'Мобильное приложение'];
  const stageOptions = ['Планирование', 'Разработка', 'Тестирование'];

  const handleChange = (
    field: keyof Task, 
    value: string | Date | User | string[] | null
  ) => {
    if (field === 'startDate' || field === 'endDate') {
      const dateValue = value instanceof Date ? value : new Date(value as string);
      setEditedTask(prev => ({ ...prev, [field]: dateValue }));
    } else if (field === 'assigned') {
      const userValue = value as User | null;
      setEditedTask(prev => ({
        ...prev,
        assigned: userValue ? {
          id: userValue.primarykey,
          name: [userValue.firstName, userValue.lastName].filter(Boolean).join(' '),
          avatarUrl: userValue.avatarUrl
        } : undefined
      }));
    } else {
      setEditedTask(prev => ({ ...prev, [field]: value }));
    }
  };

  useEffect(() => {
    const loadTask = async () => {
      if (taskId && !isCreating) {
        try {
          setIsLoading(true);
          const loadedTask = await TasksApi.getTaskById(taskId);
          console.log('sdfsd ', loadedTask)
          setTask(loadedTask);
          setEditedTask(loadedTask);
          setSelectedColor(loadedTask.color);

          const project = projects.find(p => p.primarykey === loadedTask.project);
          setProjectSearchTerm(project?.name || '');

          if (project) {
            const milestones = await MilestonesApi.getByProject(project.primarykey)
            setMilestones(milestones);
          }
        } catch (error) {
          console.error('Ошибка загрузки задачи:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadTask();
  }, [taskId, isCreating, projects]);

  useEffect(() => {
    if (isCreating) {
      setEditedTask({
        ...editedTask,
        primarykey: Math.random().toString(),
        number: `#${Math.floor(Math.random() * 1000)}`,
        status: 'todo'
      });
    }
  }, [isCreating]);

  useEffect(() => {
    if (!editedTask.project && projects.length > 0) {
      handleChange('project', projects[0].primarykey);
    }
  }, [projects]);

  const handleSubmit = async () => {
    if (!editedTask.title?.trim()) {
      setErrors({ title: 'Название обязательно для заполнения' });
      return;
    }
    setErrors({});
    try {
      setIsLoading(true);
      console.log(editedTask)
      const taskData = {
            title: editedTask.title || '',
            description: editedTask.description || '',
            status: editedTask.status || 'todo',
            type: editedTask.type as Task['type'],
            color: selectedColor || '#6366f1',
            project: editedTask.project || '',
            stage: editedTask.stage || '',
            startDate: editedTask.startDate ? new Date(editedTask.startDate) : new Date(),
            endDate: editedTask.endDate ? new Date(editedTask.endDate) : new Date(),
            priority: editedTask.priority || 'medium',
            assignedTo: editedTask.assigned?.id,
            milestoneId: editedTask.milestoneId,
            //attachments: editedTask.attachments || [],
            //attendees: editedTask.attendees || [],
            // Добавляем приведение для дат
            ...(editedTask.dueDate && { dueDate: new Date(editedTask.dueDate) })
          };

      let savedTask;
      if (isCreating) {
        savedTask = await TasksApi.createTask(taskData);
      } else if (taskId) {
        savedTask = await TasksApi.updateTask(taskId, taskData);
      }

      if (savedTask) {
        onSave(savedTask);
        if (isCreating) onClose();
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
      try {
        setIsLoading(true);
        await TasksApi.deleteTask(task!.primarykey);
        onClose();
      } catch (error) {
        console.error('Ошибка удаления:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const applyFormat = (format: string) => {
    let newDescription = editedTask.description || '';
    
    if (format === 'bold') {
      newDescription += ' **bold text** ';
    } else if (format === 'italic') {
      newDescription += ' *italic text* ';
    } else if (format === 'numbered') {
      newDescription += '\n1. First item\n2. Second item\n3. Third item';
    } else if (format === 'bulleted') {
      newDescription += '\n- Item 1\n- Item 2\n- Item 3';
    }
    
    handleChange('description', newDescription);
  };

  const renderDescription = () => {
    if (!editedTask.description) return 'Нет описания';
    
    return (
      <ReactMarkdown 
        
        components={{
          strong: ({node, ...props}) => <strong className="bold-text" {...props} />,
          em: ({node, ...props}) => <em className="italic-text" {...props} />,
          ul: ({node, ...props}) => <ul className="custom-list" {...props} />,
          li: ({node, ...props}) => <li className="list-item" {...props} />
        }}
      >
        {editedTask.description}
      </ReactMarkdown>
    );
  };

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(projectSearchTerm.toLowerCase())
  );

  const renderFiles = () => {
    if (!attachments.length) return null;

    return (
      <div className="attachments-section">
        <h4>Прикрепленные файлы:</h4>
        <div className="files-grid">
          {attachments.map(file => (
            <div key={file.id} className="file-card">
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="file-link"
              >
                <div className="file-icon">
                  {file.type.startsWith('image/') ? (
                    <img src={file.url} alt={file.name} className="preview" />
                  ) : (
                    <FileIcon type={file.type} />
                  )}
                </div>
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{file.size}</span>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="loading-overlay">Загрузка...</div>;
  }

  if (!task && !isCreating) {
    return <div className="error-message">Задача не найдена</div>;
  }

  return (
    <div className="task-container">
      <div className="task-main">
        <div className="task-header">
          <div className="title-section">
            <div className="task-meta">
              <span className="task-id">
                #{isCreating ? 'Новая задача' : editedTask.number}
              </span>
              {isEditing ? (
                <div className="title-input-wrapper">
                  <input
                    type="text"
                    className={`title-input ${errors.title ? 'error' : ''}`}
                    value={editedTask.title}
                    onChange={(e) => {
                      handleChange('title', e.target.value);
                      // Очищаем ошибку при вводе
                      if (errors.title) setErrors({ ...errors, title: undefined });
                    }}
                    placeholder="Название задачи"
                  />
                  {errors.title && (
                    <div className="validation-error">{errors.title}</div>
                  )}
                </div>
              ) : (
                <h2 className="task-title">{editedTask.title}</h2>
              )}
              {!isEditing && (
                <button className="edit-btn" onClick={onEdit}>
                  <MdEdit size={20} />
                </button>
              )}
            </div>

          </div>
        </div>

        <div className="description-container">
          {isEditing ? (
            <>
              <div className="markdown-toolbar">
                <button onClick={() => applyFormat('bold')} title="Жирный">
                  <MdFormatBold size={18} />
                </button>
                <button onClick={() => applyFormat('italic')} title="Курсив">
                  <MdFormatItalic size={18} />
                </button>
                <button onClick={() => applyFormat('numbered')} title="Нумерованный список">
                  <MdFormatListNumbered size={18} />
                </button>
                <button onClick={() => applyFormat('bulleted')} title="Маркированный список">
                  <MdFormatListBulleted size={18} />
                </button>
              </div>
              <textarea
                className="description-editor"
                value={editedTask.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Добавьте подробное описание задачи..."
              />
            </>
          ) : (
            <div className="description-view">
              {renderDescription()}
            </div>
          )}
        </div>

        <TaskComments taskId={taskId} />

        <div className="task-actions">
          {!isCreating && (
            <button className="delete-btn" onClick={handleDelete}>
              Удалить
            </button>
          )}
          <button className="cancel-btn" onClick={onClose}>
            Отмена
          </button>
          <button 
            className="save-btn" 
            onClick={handleSubmit}
            
          >
            {isLoading ? 'Сохранение...' : (isCreating ? 'Создать' : 'Сохранить')}
          </button>
        </div>
      </div>

      <div className="task-sidebar">
        <div className="form-group">
          <label>Тип</label>
          <select
            value={editedTask.type}
            onChange={(e) => handleChange('type', e.target.value)}
            disabled={!isEditing}
          >
            {typeOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Цвет</label>
          <div className="color-picker">
            {colors.map(color => (
              <div
                key={color}
                className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => isEditing && setSelectedColor(color)}
              />
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Статус</label>
          <select
            value={editedTask.status}
            onChange={(e) => handleChange('status', e.target.value)}
            disabled={!isEditing}
          >
            {statusOptions.map(option => (
              <option key={option} value={option}>
                {option === 'todo' ? 'To Do' : 
                 option === 'in_progress' ? 'In Progress' : 'Done'}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Веха</label>
          {isEditing ? (
            <select
              value={editedTask.milestoneId || ''}
              onChange={e => handleChange('milestoneId', e.target.value)}
            >
              <option value="">Без вехи</option>
              {milestones.map(m => (
                <option key={m.id} value={m.id}>
                  {m.title} ({dayjs(m.date).format('DD.MM.YYYY')})
                </option>
              ))}
            </select>
          ) : (
            <div>
              {editedTask.milestoneId
                ? milestones.find(m => m.id === editedTask.milestoneId)?.title
                : '—'}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Приоритет</label>
          <select
            value={editedTask.priority || 'medium'}
            onChange={(e) => handleChange('priority', e.target.value)}
            disabled={!isEditing}
          >
            {priorityOptions.map(option => (
              <option key={option} value={option}>
                {option === 'low' ? 'Низкий' : 
                 option === 'medium' ? 'Средний' : 'Высокий'}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Проект</label>
          <div className="project-select-container">
            <input
              type="text"
              placeholder="Поиск проекта..."
              value={projectSearchTerm}
              onChange={(e) => {
                setProjectSearchTerm(e.target.value);
                setIsProjectDropdownOpen(true);
              }}
              onFocus={() => setIsProjectDropdownOpen(true)}
              disabled={!isEditing || isLoading}
            />
            
            {isProjectDropdownOpen && isEditing && (
              <div className="project-dropdown">
                {filteredProjects.map(project => (
                  <div
                    key={project.primarykey}
                    className="project-option"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleChange('project', project.primarykey);
                      setProjectSearchTerm(project.name);
                      setIsProjectDropdownOpen(false);
                    }}
                  >
                    {project.name}
                  </div>
                ))}
                {filteredProjects.length === 0 && (
                  <div className="dropdown-empty">Нет доступных проектов</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Этап</label>
          <select
            value={editedTask.stage}
            onChange={(e) => handleChange('stage', e.target.value)}
            disabled={!isEditing}
          >
            <option value="">Выберите этап</option>
            {stageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Исполнитель</label>
          {isEditing ? (
            <div className="user-search-container">
              {editedTask.assigned?.id ? (
                <div className="selected-user">
                  {editedTask.assigned.avatarUrl && (
                    <img 
                      src={editedTask.assigned.avatarUrl} 
                      alt={editedTask.assigned.name} 
                      className="user-avatar" 
                    />
                  )}
                  <span className="user-name">
                    {editedTask.assigned.name || editedTask.assigned.id}
                  </span>
                  <button
                    className="remove-user"
                    onClick={() => handleChange('assigned', null)}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <UserSearchInput
                  selectedUsers={[]}
                  onSelect={(user) => handleChange('assigned', user)}
                  onRemove={() => {}}
                  showInput={true}
                />
              )}
            </div>
          ) : (
            <div className="assignee-view">
              {editedTask.assigned?.name || editedTask.assigned?.id || 'Не назначен'}
            </div>
          )}
        </div>

        {editedTask.type === 'Совещание' && (
          <div className="form-group">
            <label>Участники</label>
            <input
              type="text"
              value={editedTask.attendees?.join(', ') || ''}
              onChange={(e) => handleChange('attendees', e.target.value.split(',').map(s => s.trim()))}
              disabled={!isEditing}
              placeholder="Введите имена через запятую"
            />
          </div>
        )}

        <div className="form-group">
          <label>Дата начала</label>
          <input
            type="datetime-local"
            value={editedTask.startDate?.toISOString().slice(0, 16) || ''}
            onChange={(e) => handleChange('startDate', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Дата окончания</label>
          <input
            type="datetime-local"
            value={editedTask.endDate?.toISOString().slice(0, 16) || ''}
            onChange={(e) => handleChange('endDate', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default OpenTask;