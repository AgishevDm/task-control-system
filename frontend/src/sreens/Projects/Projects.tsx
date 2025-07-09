import { useState, useEffect, useRef, useMemo } from 'react';
import { FiSearch, FiFilter, FiPlus, FiMoreVertical } from 'react-icons/fi';
import { Project, ParticipantsAvatarsProps, StatusBadgeProps, ProjectMember, TeamMember } from '../../types/project';
import { ProjectEditModal } from './ProjectEditModal';
import { ProjectsApi } from '../../api/projects';
import './styles/main.scss';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ParticipantsAvatars = ({ members }: { members: Array<ProjectMember | TeamMember> }) => {
  const [showAll, setShowAll] = useState(false);
  const visibleParticipants = members.slice(0, 5);
  const hiddenCount = members.length - 5;

  return (
    <div className="avatars-container">
      <div className="avatars-list">
        {visibleParticipants.map((member) => (
          <div 
            key={member.account.primarykey}
            className="avatar-item"
            title={`${member.account.firstName} ${member.account.lastName}`}
          >
            {member.account.avatarUrl ? (
              <img 
                src={member.account.avatarUrl} 
                alt="Avatar" 
                className="avatar-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`avatar-fallback ${member.account.avatarUrl ? 'hidden' : ''}`}>
              {member.account.firstName?.[0]}{member.account.lastName?.[0]}
            </div>
          </div>
        ))}
      </div>
      
      {hiddenCount > 0 && (
        <div className="more-count-container">
          <div 
            className="more-count"
            onMouseEnter={() => setShowAll(true)}
            onMouseLeave={() => setShowAll(false)}
          >
            +{hiddenCount}
          </div>
          
          {showAll && (
            <div className="hidden-participants-tooltip">
              {members.slice(5).map((member) => (
                <div key={member.account.primarykey} className="hidden-participant">
                  {member.account.avatarUrl ? (
                    <img 
                      src={member.account.avatarUrl} 
                      alt="Avatar" 
                      className="tooltip-avatar"
                    />
                  ) : (
                    <div className="tooltip-avatar-fallback">
                      {member.account.firstName?.[0]}{member.account.lastName?.[0]}
                    </div>
                  )}
                  <span className="tooltip-name">
                    {member.account.firstName} {member.account.lastName}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusClass = {
    'В работе': 'in-progress',
    'Завершен': 'completed',
    'Приостановлен': 'paused'
  }[status];

  return (
    <span className={`status-badge ${statusClass}`}>
      {status}
    </span>
  );
};

const ActionsMenu = ({ onEdit, onDelete, project, currentUserId, onInfo }: {
    onEdit: () => void;
    onDelete: () => Promise<void>;
    onInfo: () => void;
    project: Project;
    currentUserId?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="actions-menu" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="menu-trigger"
      >
        <FiMoreVertical className="menu-icon" />
      </button>
      
      {isOpen && (
      <div className="menu-dropdown">
        {project.createdBy === currentUserId && (
          <button 
            className="menu-item" 
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
              setIsOpen(false);
            }}
          >
            Редактировать
          </button>
        )}
        {project.createdBy !== currentUserId && (
          <button 
            className="menu-item" 
            onClick={(e) => {
              e.stopPropagation();
              onInfo();
              setIsOpen(false);
            }}
          >
            Информация
          </button>
        )}
        {project.createdBy === currentUserId && (
          <button 
            className="menu-item delete" 
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Удаление...' : 'Удалить'}
          </button>
        )}
      </div>
      )}
    </div>
  );
};

export default function Projects() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    project: Project | null;
    isEditing: boolean;
  }>({
    isOpen: false,
    project: null,
    isEditing: true
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'my' | 'member'>('my');
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [memberProjects, setMemberProjects] = useState<Project[]>([]);
  const { user: authUser } = useAuth();
  const [selectedProjectInfo, setSelectedProjectInfo] = useState<Project | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const [my, member] = await Promise.all([
          ProjectsApi.getAllProjects(),
          ProjectsApi.getAllUserProjects()
        ]);
        setMyProjects(my);
        setMemberProjects(member);
        setError('');
      } catch (err) {
        setError('Ошибка загрузки проектов');
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const allProjects = useMemo(() => {
    const combined = [...myProjects, ...memberProjects];
    // Удаляем дубликаты по primarykey
    return combined.filter(
      (project, index, self) =>
        index === self.findIndex((p) => p.primarykey === project.primarykey)
    );
  }, [myProjects, memberProjects]);

  const [filters, setFilters] = useState({
    search: '',
    status: '' as '' | 'В работе' | 'Завершен' | 'Приостановлен',
    showFilters: false
  });

  const filteredProjects = useMemo(() => {
    return allProjects.filter(project => {
      const baseFilter = 
        project.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        (filters.status ? project.status === filters.status : true);

      if (activeTab === 'my') {
        return baseFilter && myProjects.some(p => p.primarykey === project.primarykey);
      }
      return baseFilter && 
        memberProjects.some(p => p.primarykey === project.primarykey);
    });
  }, [allProjects, filters, activeTab, myProjects, memberProjects]);

  const handleCreateClick = () => {
    setModalState({
      isOpen: true,
      project: null,
      isEditing: false
    });
  };

  const handleCreateProject = async (newProject: Project) => {
    try {
      const created = await ProjectsApi.createProject(newProject);
      setProjects([...projects, created]);
    } catch (err) {
      setError('Ошибка создания проекта');
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    try {
      if (!updatedProject.primarykey) throw new Error('Project ID is required');
      
      const updated = await ProjectsApi.updateProject(
        updatedProject.primarykey,
        updatedProject
      );
      setProjects(projects.map(p => p.primarykey === updated.primarykey ? updated : p));
    }
    catch (e) {

    }
  };

  const handleSaveProject = async (project: Project) => {
    if (modalState.isEditing) {
      await handleUpdateProject(project);
    } else {
      await handleCreateProject(project);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await ProjectsApi.deleteProject(projectId);
      setProjects(projects.filter(p => p.primarykey !== projectId));
    } catch (err) {
      setError('Ошибка удаления проекта');
    }
  };

  const handleLogoUpload = async (projectId: string, file: File) => {
    try {
      const updated = await ProjectsApi.uploadLogo(projectId, file);
      setProjects(projects.map(p => p.primarykey === updated.primarykey ? updated : p));
    } catch (err) {
      setError('Ошибка загрузки логотипа');
    }
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
              <div className="loading-text">Загружаем проекты...</div>
            </div>
          </div>
          <div className="calendar-wrapper"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="projects-container">
      <div className="projects-table-container">
        <div className="tabs-container">
          <button 
            className={`tab-button ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            Мои проекты
          </button>
          <button 
            className={`tab-button ${activeTab === 'member' ? 'active' : ''}`}
            onClick={() => setActiveTab('member')}
          >
            Участвую
          </button>
        </div>
        <div className="search-filter-container">
          <div className="search-input">
            <input
              type="text"
              placeholder="Поиск проектов..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
            <FiSearch className="search-icon" />
          </div>
          
          <button 
            className="filter-button"
            onClick={() => setFilters({...filters, showFilters: !filters.showFilters})}
          >
            <FiFilter className="filter-icon" />
            <span>Фильтр</span>
          </button>
          
          {filters.showFilters && (
            <div className="filters-dropdown">
              <div className="filter-group">
                <label>Статус:</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({
                    ...filters, 
                    status: e.target.value as typeof filters.status
                  })}
                >
                  <option value="">Все статусы</option>
                  <option value="В работе">В работе</option>
                  <option value="Завершен">Завершен</option>
                  <option value="Приостановлен">Приостановлен</option>
                </select>
              </div>
              <button 
                className="reset-filters"
                onClick={() => setFilters({
                  search: '',
                  status: '',
                  showFilters: false
                })}
              >
                Сбросить фильтры
              </button>
            </div>
          )}
          
          <button 
            className="create-button"
            onClick={handleCreateClick}
          >
            <FiPlus className="create-icon" />
            <span>Создать</span>
          </button>
        </div>

          {(filters.search || filters.status) && (
            <div className="active-filters">
              <span>Активные фильтры:</span>
              {filters.search && (
                <span className="filter-tag">
                  Название: "{filters.search}"
                  <button onClick={() => setFilters({...filters, search: ''})}>×</button>
                </span>
              )}
              {filters.status && (
                <span className="filter-tag">
                  Статус: {filters.status}
                  <button onClick={() => setFilters({...filters, status: ''})}>×</button>
                </span>
              )}
            </div>
          )}

          {modalState.isOpen && (
            <ProjectEditModal
              project={modalState.project || undefined}
              onClose={() => setModalState({...modalState, isOpen: false})}
              onSave={(newProject) => {
                handleSaveProject(newProject);
                setModalState({...modalState, isOpen: false});
              }}
              isEditing={modalState.isEditing}
              isCreator={true}
            />
          )}

        <table className="projects-table">
          <thead>
            <tr>
              <th className="rounded-left">№</th>
              <th>Название</th>
              <th>Сроки</th>
              <th>Участники</th>
              <th>Статус</th>
              <th className="rounded-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project, index) => (
                <tr 
                  key={project.primarykey}
                  onClick={() => navigate(`/projects/${project.primarykey}`)}
                  className="project-row"
                >
                <td data-label="№">{index + 1}</td>
                <td data-label="Название">
                  <div className="project-name-cell">
                    {project.logoUrl ? (
                      <img 
                        src={project.logoUrl || '/default-project.png'} 
                        className="project-logo" 
                        alt="Логотип проекта"
                      />
                    ): (
                      <div className="project-logo">
                        {project.name?.[0]}
                      </div>
                    )}
                    <span className="project-name">{project.name}</span>
                  </div>
                </td>
                <td data-label="Сроки">
                  {`${new Date(project.startDate).toLocaleDateString()} - ${new Date(project.endDate).toLocaleDateString()}`}
                </td>
                <td data-label="Участники">
                  <ParticipantsAvatars members={project.ProjectMember} />
                </td>
                <td data-label="Статус">
                  <StatusBadge status={project.status} />
                </td>
                <td data-label="Действия">
                <ActionsMenu 
                  onEdit={() => {
                    if (project.createdBy === authUser?.id) {
                      setSelectedProject(project);
                    }
                  }}
                  onInfo={() => setSelectedProject(project)}
                  onDelete={() => handleDeleteProject(project.primarykey)}
                  project={project}
                  currentUserId={authUser?.id}
                />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* {selectedProject && (
          <ProjectEditModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            onSave={(updatedProject) => {
              setProjects(projects.map(p => 
                p.primarykey === updatedProject.primarykey ? updatedProject : p
              ));
              setSelectedProject(null);
            }}
            isEditing={selectedProject.createdBy === authUser?.id}
            isCreator={selectedProject.createdBy === authUser?.id}
          />
        )} */}
      </div>
    </div>
  );
}