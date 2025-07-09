import React, { useEffect, useState } from 'react';
import OpenTask from './OpenTask';
import { MdMoreVert, MdEdit } from 'react-icons/md';
import './Task.scss';
import { Task as TaskType } from '../../types/task';
import { TasksApi } from '../../api/tasks.api';
import { ProjectsApi } from '../../api/projects';
import { Project } from '../../types/project';

const Task: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [showMenuId, setShowMenuId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreatingNewTask, setIsCreatingNewTask] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [tasksData, memberProjectsData, myProjectsData] = await Promise.all([
          TasksApi.getAllTasks(),
          ProjectsApi.getAllProjects(),
          ProjectsApi.getAllUserProjects()
        ]);

        const combinedProjects = [...myProjectsData, ...memberProjectsData].filter(
          (project, index, self) =>
            index === self.findIndex((p) => p.primarykey === project.primarykey)
        );

        setProjects(combinedProjects);
        setTasks(tasksData);
      } catch (error) {
        console.error('Ошибка загрузки:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: TaskType['status']) => {
    try {
      const updatedTask = await TasksApi.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t.primarykey === taskId ? updatedTask : t));
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await TasksApi.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.primarykey !== taskId));
      if (selectedTaskId === taskId) setSelectedTaskId(null);
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const handleCreateTask = () => {
    const newTask: TaskType = {
      primarykey: Math.random().toString(),
      number: `#${Math.floor(Math.random() * 1000)}`,
      title: '',
      startDate: new Date(),
      endDate: new Date(),
      color: '#6366f1',
      type: 'Задача',
      status: 'todo',
      project: '',
      stage: '',
      priority: 'medium',
      assigned: { 
        id: '',
        name: '',
        avatarUrl: '',
      },
      description: ''
    };
    setTasks([...tasks, newTask]);
    setSelectedTaskId(newTask.primarykey);
    setIsCreatingNewTask(true);
    setIsEditing(true);
  };

  const handleSaveTask = (updatedTask: TaskType) => {
    setTasks(prev => {
      if (isCreatingNewTask) {
        return prev.filter(t => t.primarykey !== selectedTaskId).concat(updatedTask);
      }
      return prev.map(t => t.primarykey === updatedTask.primarykey ? updatedTask : t);
    });
    setSelectedTaskId(null);
    setIsCreatingNewTask(false);
    setIsEditing(false);
  };

  const handleUseAsTemplate = (task: TaskType) => {
    const newTask = {
      ...task,
      primarykey: Math.random().toString(),
      number: `#${Math.floor(Math.random() * 1000)}`,
      title: '',
      description: '',
      status: 'todo' as 'todo'
    };
    setTasks([...tasks, newTask]);
    setSelectedTaskId(newTask.primarykey);
    setIsCreatingNewTask(true);
    setIsEditing(true);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus ? task.status === selectedStatus : true;
    const matchesProject = selectedProject ? task.project === selectedProject : true;
    const matchesStage = selectedStage ? task.stage === selectedStage : true;
    return matchesSearch && matchesStatus && matchesProject && matchesStage;
  });

  const selectedTask = selectedTaskId ? tasks.find(task => task.primarykey === selectedTaskId) : null;

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
              <div className="loading-text">Загружаем задачи...</div>
            </div>
          </div>
          <div className="calendar-wrapper"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="task-page">
      {!selectedTaskId ? (
        <div className="task-list-container">
          <div className="task-controls">
            <div className="search-filter">
              <input
                type="text"
                placeholder="Поиск задач..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">Все статусы</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <select
                className="filter-select"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="">Все проекты</option>
                {projects.map(project => (
                  <option key={project.primarykey} value={project.primarykey}>
                    {project.name}
                  </option>
                ))}
              </select>
              <select
                className="filter-select"
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
              >
                <option value="">Все этапы</option>
                <option value="Планирование">Планирование</option>
                <option value="Разработка">Разработка</option>
                <option value="Тестирование">Тестирование</option>
              </select>
            </div>
            <button className="create-task-btn" onClick={handleCreateTask}>
              + Создать задачу
            </button>
          </div>
          <table className="task-table">
            <thead className="table-header">
              <tr>
                <th>№</th>
                <th>Название</th>
                <th>Исполнитель</th>
                <th>Тип</th>
                <th>Приоритет</th>
                <th>Статус</th>
                <th>Проект</th>
                <th>Этап</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => (
                <tr 
                  key={task.primarykey} 
                  className="task-row"
                  onClick={() => {
                    setSelectedTaskId(task.primarykey);
                    setIsEditing(false);
                  }}
                >
                  <td>#{task.number}</td>
                  <td>
                    <div className="task-color" style={{ backgroundColor: task.color }} />
                    {task.title}
                  </td>
                  <td>
                    <div className="assignee-info">
                      {task.assigned?.avatarUrl ? (
                        <img 
                          src={task.assigned?.avatarUrl} 
                          alt={task.assigned?.name} 
                          className="avatar" 
                        />
                      ) : (
                        <div className="avatar">
                          {task.assigned?.name.slice(0, 1)}
                        </div>
                      )}
                      {task.assigned?.name}
                    </div>
                  </td>
                  <td>{task.type}</td>
                  <td>{task.priority}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      className="status-select"
                      value={task.status}
                      disabled
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </td>
                  <td>
                    {projects.find(p => p.primarykey === task.project)?.name || 'Без проекта'}
                  </td>
                  <td>{task.stage}</td>
                  <td>
                    <div className="context-menu">
                      <div 
                        className="menu-dots" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenuId(prev => prev === task.primarykey ? null : task.primarykey);
                        }}
                      >
                        <MdMoreVert size={20} />
                      </div>
                      {showMenuId === task.primarykey && (
                        <div className="menu-content">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTaskId(task.primarykey);
                              setIsEditing(true);
                              setShowMenuId(null);
                            }}
                          >
                            Изменить
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Вы уверены, что хотите удалить задачу?')) {
                                handleDeleteTask(task.primarykey);
                              }
                              setShowMenuId(null);
                            }}
                          >
                            Удалить
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUseAsTemplate(task);
                              setShowMenuId(null);
                            }}
                          >
                            Использовать как шаблон
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <OpenTask
          taskId={selectedTaskId}
          isCreating={isCreatingNewTask}
          isEditing={isEditing}
          projects={projects}
          users={[]}
          onClose={() => {
            if (isCreatingNewTask) {
              setTasks(tasks.filter(t => t.primarykey !== selectedTaskId));
            }
            setSelectedTaskId(null);
            setIsCreatingNewTask(false);
            setIsEditing(false);
          }}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onEdit={() => setIsEditing(true)}
        />
      )}
    </div>
  );
};

export default Task;