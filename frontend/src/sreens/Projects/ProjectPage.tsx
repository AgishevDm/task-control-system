import { useEffect, useState } from 'react';
import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import { ProjectsApi } from '../../api/projects';
import { Project } from '../../types/project';
import { useAuth } from '../../context/AuthContext';
import './styles/projectPage.scss';
import { ProjectSettingsModal } from './ProjectSettingsModal';
import { TasksApi } from '../../api/tasks.api';
import { Task as TaskType } from '../../types/task';

export default function ProjectPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProject = async () => {
      try {
        console.log('sa asf d')
        const data = await ProjectsApi.getProjectById(projectId!);
        setProject(data);
      } catch (error) {
        console.error('Error loading project:', error);
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };
    
    loadProject();
  }, [projectId]);

  const handleUpdateProject = (updatedProject: Project) => {
    setProject(updatedProject);
    setSettingsOpen(false);
  };

  if (loading) return (
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
            <div className="loading-text">Загружаем проект...</div>
          </div>
        </div>
        <div className="calendar-wrapper"></div>
      </div>
    </div>
  </div>
  );
  if (!project) return <div>Проект не найден</div>;

  return (
    <div className="project-page">
      <div className="project-header">
        <h1>{project.name}</h1>
        <div className="project-meta">
          <span className="status" data-status={project.status}>
            {project.status}
          </span>
          <span className="dates">
            {new Date(project.startDate).toLocaleDateString()} -{' '}
            {new Date(project.endDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      <nav className="project-tabs">
        <NavLink 
          to=""
          end
          className={({ isActive }: { isActive: boolean }) => isActive ? 'active' : ''}
        >
          Доска
        </NavLink>
        <NavLink 
          to="analytics"
          end
          className={({ isActive }: { isActive: boolean }) => isActive ? 'active' : ''}
        >
          Аналитика
        </NavLink>
        <NavLink 
          to="gant"
          end
          className={({ isActive }: { isActive: boolean }) => isActive ? 'active' : ''}
        >
          Гант
        </NavLink>
        <NavLink to="milestones" end className={({ isActive }) => isActive ? 'active' : ''}>
          Вехи
        </NavLink>
        {project.createdBy === user?.id && (
          <button 
            className={`settings-tab ${settingsOpen ? 'active' : ''}`}
            onClick={() => setSettingsOpen(true)}
          >
            Настройки
          </button>
        )}
      </nav>

      <div className="project-content">
        <Outlet context={project} />
        {settingsOpen && (
          <ProjectSettingsModal 
            project={project}
            onClose={() => setSettingsOpen(false)}
            onUpdate={handleUpdateProject}
          />
        )}
      </div>
    </div>
  );
}