import { useOutletContext } from 'react-router-dom';
import { Project } from '../../types/project';
import { Task } from '../../types/task';
import { useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  UniqueIdentifier
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import './styles/projectBoard.scss';
import { TasksApi } from '../../api/tasks.api';
import OpenTask from '../Task/OpenTask';

type Column = {
  id: string;
  title: string;
  status: Task['status'];
};

const columns: Column[] = [
  { id: 'todo', title: 'Сделать', status: 'todo' },
  { id: 'in_progress', title: 'В работе', status: 'in_progress' },
  { id: 'done', title: 'Завершено', status: 'done' }
];

export default function ProjectBoard() {
  const project = useOutletContext<Project>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const tasksData = await TasksApi.getProjectTasks(project.primarykey);
        setTasks(tasksData);
      } catch (error) {
        console.error('Ошибка загрузки задач:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [project.primarykey]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over) return;

    const activeTask = tasks.find(t => t.primarykey === active.id);
    if (!activeTask) return;

    // Определение целевого статуса
    const getColumnStatus = (id: UniqueIdentifier): Task['status'] => {
      if (id.toString().startsWith('empty')) {
        return columns.find(c => c.id === id.toString().split('-')[1])?.status || activeTask.status;
      }
      const task = tasks.find(t => t.primarykey === id);
      return task?.status || 
        columns.find(c => c.id === id)?.status || 
        activeTask.status;
    };

    const targetStatus = getColumnStatus(over.id);
    
    // Если статус не изменился - ничего не делаем
    if (activeTask.status === targetStatus) {
      setActiveId(null);
      return;
    }

    try {
      // Оптимистичное обновление
      const updatedTask = {
        ...activeTask,
        status: targetStatus
      };

      const newTasks = tasks.map(task => 
        task.primarykey === active.id ? updatedTask : task
      );

      setTasks(newTasks);
      setActiveId(null);

      // Отправляем изменение на сервер
      await TasksApi.updateTask(activeTask.primarykey, {
        status: targetStatus
      });
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
      // Возвращаем предыдущее состояние при ошибке
      setTasks([...tasks]);
    }
  };

  const handleCloseTask = () => {
    setSelectedTaskId(null);
    setIsEditingTask(false);
    setIsCreatingTask(false);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsEditingTask(false);
  };

  const handleCreateTask = () => {
    setSelectedTaskId('new-task');
    setIsEditingTask(true);
    setIsCreatingTask(true);
  };

  const handleSaveTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => 
      t.primarykey === updatedTask.primarykey ? updatedTask : t
    ));
    setSelectedTaskId(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await TasksApi.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.primarykey !== taskId));
      if (selectedTaskId === taskId) setSelectedTaskId(null);
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
    }
  };

  const getTasksByStatus = (status: Task['status']) => 
    tasks.filter(task => task.status === status);

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffd166';
      case 'low': return '#06d6a0';
      default: return '#e0e0e0';
    }
  };

  if (isLoading) return (
    <div className="page-container">
      <div className="scroll-container">
        <div className="profile-container">
          <div className="tasks-wrapper">
            <div className="loading-container">
              <div className="wave-loading">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="loading-text">Загружаем доску...</div>
            </div>
          </div>
          <div className="calendar-wrapper"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="project-board">
      {selectedTaskId ? (
        <OpenTask
          taskId={selectedTaskId}
          isEditing={isEditingTask}
          projects={[project]}
          onClose={handleCloseTask}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onEdit={() => setIsEditingTask(true)}
          isCreating={isCreatingTask}
          isInProject={true}
          />
      ) : (
      <>
          <div className="board-header">
            <h2>Доска проекта {project.name}</h2>
            <button 
              className="create-task-btn"
              onClick={handleCreateTask}
            >
              + Создать задачу
            </button>
          </div>
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="board-container">
            {columns.map(column => {
              const tasksInColumn = getTasksByStatus(column.status);
              return (
                <div 
                  key={column.id} 
                  className="column"
                  data-column-id={column.id}
                  data-status={column.status}
                >
                  <div className={`column-header ${column.status}`}>
                    {column.title} ({tasksInColumn.length})
                  </div>
                  <SortableContext 
                    id={column.id}
                    items={tasksInColumn.map(t => t.primarykey)}
                    strategy={verticalListSortingStrategy}
                  >
                    {tasksInColumn.map(task => (
                      <SortableItem 
                        key={task.primarykey} 
                        id={task.primarykey}
                        data={{ type: 'task', task }}
                      >
                        <div className="task-card" style={{ borderLeft: `4px solid ${task.color}` }} onClick={() => handleTaskClick(task.primarykey)}>
                          <div className="task-content">
                            <div className="task-title">
                              {task.number && <span className="task-number">#{task.number}</span>}
                              {task.title}
                            </div>
                            
                            {task.description && (
                              <div className="task-description">{task.description}</div>
                            )}
                            
                            <div className="task-meta">
                              <div className="task-priority" style={{ 
                                backgroundColor: getPriorityColor(task.priority) 
                              }}>
                                {task.priority === 'high' ? 'Высокий' : 
                                task.priority === 'medium' ? 'Средний' : 'Низкий'}
                              </div>
                              
                              {task.assigned && (
                                <div className="task-assignee">
                                  {task.assigned.avatarUrl ? (
                                    <img 
                                      src={task.assigned.avatarUrl} 
                                      alt={task.assigned.name} 
                                      className="assignee-avatar"
                                    />
                                  ) : (
                                    <div className="assignee-initials">
                                      {task.assigned.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="task-dates">
                              {task.startDate && (
                                <span>Начало: {formatDate(task.startDate)}</span>
                              )}
                              {task.dueDate && (
                                <span className="due-date">
                                  Срок: {formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </SortableItem>
                    ))}
                    
                    {/* Пустая область для дропа */}
                    <SortableItem 
                      id={`empty-${column.id}`} 
                      data={{ type: 'column', column }}
                    >
                      <div 
                        className="empty-drop-area" 
                        style={{ 
                          minHeight: tasksInColumn.length === 0 ? '100px' : '50px',
                          opacity: tasksInColumn.length === 0 ? 1 : 0.5
                        }}
                      />
                    </SortableItem>
                  </SortableContext>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeId ? (
              <div className="task-card" style={{ 
                transform: 'scale(1.05) rotate(2deg)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                borderLeft: `4px solid ${tasks.find(t => t.primarykey === activeId)?.color || '#ccc'}`
              }}>
                <div className="task-content">
                  <div className="task-title">
                    {tasks.find(t => t.primarykey === activeId)?.title}
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </>
      )}
    </div>
  );
}