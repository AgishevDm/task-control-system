import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Project, Team, ProjectMember, TeamMember, User as Account, User } from '../../types/project';
import { projectRoles, teamRoles } from '../../types/project';
import { ProjectsApi } from '../../api/projects';
import { createApiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { spawn } from 'child_process';

interface ProjectEditModalProps {
  project?: Project;
  onClose: () => void;
  onSave: (project: Project) => void;
  isEditing?: boolean;
  isCreator?: boolean;
}

export const ProjectEditModal = ({ 
  project,
  onClose,
  isEditing,
  onSave,
  isCreator = false
}: ProjectEditModalProps) => {
  const initialProject: Project = project || {
    primarykey: '',
    name: '',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    status: 'В работе',
    createdAt: new Date().toISOString(),
    createdBy: '',
    ProjectMember: [],
    teams: [],
    logoUrl: null,
  };

  const [form, setForm] = useState(initialProject);
  const [logoPreview, setLogoPreview] = useState(initialProject.logoUrl || '');
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Account[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProjectRole, setSelectedProjectRole] = useState<projectRoles>(projectRoles.USER);
  const [selectedTeamRole, setSelectedTeamRole] = useState<teamRoles>(teamRoles.MEMBER);
  const apiClient = createApiClient();
  const { user: authUser } = useAuth();

  const isFieldDisabled = !isEditing ? !isCreator : false;

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await apiClient.get(`/users/search?query=${encodeURIComponent(searchQuery)}`);
      console.log(res.data)
      setSearchResults(res.data);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTeamSearch = () => {
  const projectMembers = form.ProjectMember.map(m => m.account).filter(Boolean);;
  const filtered = projectMembers.filter(user => {
    const login = user?.login || '';
    const email = user?.email || '';
    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';
    
    return (
      login.includes(searchQuery) ||
      email.includes(searchQuery) ||
      `${firstName} ${lastName}`.includes(searchQuery)
    );
  });
  setSearchResults(filtered);
};

  useEffect (() => {
    console.log(authUser)
    if (!authUser) return;
    if (form.ProjectMember.some(m => m.accountId === authUser.id)) return;
    handleProjectAddMember({
      primarykey: authUser.id,
      firstName: authUser.firstName,
      lastName: authUser.lastName,
      email: authUser.email,
      login: authUser.login,
      avatarUrl: authUser.avatarUrl,
    });
  }, []);

  const handleProjectAddMember = (user: Account) => {

    if (form.ProjectMember.some(m => m.accountId === user.primarykey)) {
      alert('Пользователь уже добавлен');
      return;
    }

    console.log(user)

      setForm({
        ...form,
        ProjectMember: [
          ...form.ProjectMember,
          {
            primarykey: '',
            accountId: user.primarykey,
            role: {
              name: selectedProjectRole,
            },
            account: user,
          }
        ]
      });
      setSearchQuery('');
      setSearchResults([]);
  };

  const handleAddTeamMember = (user: User) => {
    if (!selectedTeam) return;

    const newMember = {
      primarykey: '',
      accountId: user.primarykey,
      role: selectedTeamRole,
      account: user
    };

    const updatedTeam = {
      ...selectedTeam,
      members: [...selectedTeam.members, newMember]
    };

    const updatedTeams = form.teams.map(t => 
      t.primarykey === selectedTeam.primarykey ? updatedTeam : t
    );

    setForm({ ...form, teams: updatedTeams });
    setSelectedTeam(updatedTeam);
  };

  const updateProjectMemberRole = (memberId: string, newRole: projectRoles) => {
    setForm({
      ...form,
      ProjectMember: form.ProjectMember.map(m => 
        m.primarykey === memberId ? { ...m, role: { name: newRole } } : m
      )
    });
  };

  const updateTeamMemberRole = (memberId: string, newRole: teamRoles) => {
    const updatedTeams = form.teams.map(team => ({
      ...team,
      members: team.members.map(m => 
        m.primarykey === memberId ? { ...m, role: newRole } : m
      )
    }));
    
    setForm({ ...form, teams: updatedTeams });
    
    if (selectedTeam) {
      const updatedSelectedTeam = updatedTeams.find(t => 
        t.primarykey === selectedTeam.primarykey
      );
      if (updatedSelectedTeam) setSelectedTeam(updatedSelectedTeam);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({...form, startDate: e.target.value});
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({...form, endDate: e.target.value});
  };

  const handleSubmit = async () => {
    try {
      if (!form.name.trim() || !form.startDate || !form.endDate) {
        alert('Укажите название проекта');
        return;
      }

      if (new Date(form.endDate) < new Date(form.startDate)) {
        alert('Дата окончания не может быть раньше даты начала');
        return;
      }

      let logoUrl = form.logoUrl;
      if (logoFile) {
        if (form.primarykey) {
          // Для существующего проекта
          const uploadResponse = await ProjectsApi.uploadLogo(form.primarykey, logoFile);
          logoUrl = uploadResponse.logoUrl;
        } else {
          // Для нового проекта сначала создаем проект без логотипа,
          // затем загружаем логотип и обновляем проект
          const projectWithoutLogo = {
            ...form,
            logoUrl: null
          };
          
          const createdProject = await ProjectsApi.createProject(projectWithoutLogo);
          const uploadResponse = await ProjectsApi.uploadLogo(createdProject.primarykey, logoFile);
          
          logoUrl = uploadResponse.logoUrl;
          // Обновляем проект с URL логотипа
          await ProjectsApi.updateProject(createdProject.primarykey, {
            ...createdProject,
            logoUrl
          });
        }
      }

      // 2. Создаем/обновляем проект с актуальным URL логотипа
      const projectData = {
        ...form,
        logoUrl
      };

      console.log(form)

      const savedProject = form.primarykey
        ? await ProjectsApi.updateProject(form.primarykey, projectData)
        : await ProjectsApi.createProject(projectData);

      onSave(savedProject);
    } catch (err) {
      alert('Ошибка сохранения проекта');
    }
  };

return (
    <Dialog open={true} onClose={onClose} className="edit-modal">
      <div className="edit-modal__overlay" aria-hidden="true" />
      
      <div className="edit-modal__content">
        <h2 className="edit-modal__header">
          {!isFieldDisabled ? (
            isEditing ? 'Редактирование проекта' : 'Создание нового проекта'
          ) : (
            'Просмотр проекта'
          )}
          
        </h2>
        
        <div className="edit-modal__grid">
          {/* Левый блок - Основная информация */}
          <div className="edit-modal__left-block">
            <div className="edit-modal__header-section">
              <div className="edit-modal__logo-upload">
                {logoPreview && (
                  <div className="edit-modal__logo-actions">
                    <button
                      type="button"
                      className="edit-modal__clear-button"
                      onClick={() => {
                        setLogoPreview('');
                        setForm({...form, logoUrl: ''});
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                <img 
                  src={logoPreview || '/default-project.png'} 
                  className="edit-modal__logo-image"
                  alt="Логотип проекта"
                />
                <label className="edit-modal__logo-label">
                  <input
                    type="file"
                    className="edit-modal__file-input"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  {logoPreview ? 'Изменить' : 'Добавить логотип'}
                </label>
              </div>
              
              <div className="edit-modal__title-section">
                <input
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="edit-modal__title-input"
                  placeholder="Название проекта"
                  disabled={isFieldDisabled}
                />
                <select
                  value={form.status}
                  onChange={(e) => setForm({...form, status: e.target.value as any})}
                  className="edit-modal__status-select"
                  disabled={isFieldDisabled}
                >
                  {['В работе', 'Завершен', 'Приостановлен'].map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="date-fields">
            <input
              type="date"
              value={form.startDate.split('T')[0]}
              onChange={handleStartDateChange}
              disabled={isFieldDisabled}
            />
              <span>—</span>
            <input
              type="date"
              value={form.endDate.split('T')[0]}
              onChange={handleEndDateChange}
              disabled={isFieldDisabled}
            />
            </div>

            <div className="edit-modal__description-section">
              <label className="edit-modal__label">Описание проекта</label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm({...form, description: e.target.value})}
                className="edit-modal__description-textarea"
                placeholder="Добавьте описание проекта..."
                disabled={isFieldDisabled}
              />
            </div>

            <div className="edit-modal__team-section">
              <div className="team-creator">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Название новой команды"
                  className="edit-modal__team-input"
                  disabled={isFieldDisabled}
                />
                <button 
                  onClick={() => {
                    if (newTeamName) {
                      setForm({
                        ...form,
                        teams: [
                          ...form.teams,
                          {
                            primarykey: '',
                            name: newTeamName,
                            members: [],
                            projectId: form.primarykey
                          }
                        ]
                      });
                      setNewTeamName('');
                    }
                  }}
                  className="edit-modal__add-team-button"
                  disabled={isFieldDisabled}
                >
                  Добавить команду
                </button>
              </div>

              <div className="teams-list">
                {form.teams.map(team => (
                  <div key={team.primarykey} className="team-card">
                    <div className="team-header">
                      <h4 className="team-name">{team.name}</h4>
                      <button 
                        className={`team-manage-button ${isFieldDisabled ? 'hidden' : ''}`}
                        onClick={() => { setSelectedTeam(team); console.log(team)} }
                        disabled={isFieldDisabled}
                      >
                        Управление
                      </button>
                    </div>
                    <div className="team-members">
                      {team.members.map(member => (
                        <div key={member.primarykey} className="team-member">
                          <span className="member-name">
                            {member.account?.firstName} {member.account?.lastName}
                          </span>
                          <span className="member-role">{member.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selectedTeam && (
            <div className="team-members-modal">
              <div className="modal-content">
                <h3>Управление командой:</h3>

                <input
                  value={selectedTeam.name}
                  onChange={(e) => {
                    const updatedTeam = { ...selectedTeam, name: e.target.value };
                    const updatedTeams = form.teams.map(t => 
                      t.primarykey === selectedTeam.primarykey ? updatedTeam : t
                    );
                    setForm({ ...form, teams: updatedTeams });
                    setSelectedTeam(updatedTeam);
                  }}
                  className="team-name-edit"
                  disabled={isFieldDisabled}
                />
                
                <div className="available-members">
                  <h4>Доступные участники проекта:</h4>
                  {form.ProjectMember
                    .filter(projectMember => 
                      !selectedTeam.members.some(m => m.accountId === projectMember.accountId)
                    )
                    .map(projectMember => (
                      <div key={projectMember.primarykey} className="member-item">
                        <div className="member-info">
                          <span>
                            {projectMember.account?.firstName} {projectMember.account?.lastName}
                          </span>
                          <span className="member-role">{projectMember.role.name}</span>
                        </div>
                        <span></span>
                        <button
                          className="add-button"
                          onClick={() => handleAddTeamMember(projectMember.account)}
                          title="Добавить в команду"
                          disabled={isFieldDisabled}
                        >
                          +
                        </button>
                      </div>
                    ))}
                </div>

                <div className="current-members">
                  <h4>Участники команды:</h4>
                  {selectedTeam.members.map(member => (
                    <div key={member.primarykey} className="member-item">
                      <div className="member-info">
                        <span>{member.account?.firstName} {member.account?.lastName}</span>
                        <select
                          value={member.role}
                          onChange={(e) => 
                            updateTeamMemberRole(member.primarykey, e.target.value as teamRoles)
                          }
                          className="role-select"
                        >
                          {Object.values(teamRoles).map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                      <button 
                        className="remove-button"
                        onClick={() => {
                          const updatedTeam = {
                            ...selectedTeam,
                            members: selectedTeam.members.filter(m => 
                              m.primarykey !== member.primarykey
                            )
                          };
                          
                          const updatedTeams = form.teams.map(t => 
                            t.primarykey === selectedTeam.primarykey ? updatedTeam : t
                          );
                          
                          setForm({ ...form, teams: updatedTeams });
                          setSelectedTeam(updatedTeam);
                        }}
                        disabled={isFieldDisabled}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <button 
                  className="close-button"
                  onClick={() => setSelectedTeam(null)}
                >
                  Закрыть
                </button>
              </div>
            </div>
          )}

          {/* Правый блок - Участники */}
          <div className="edit-modal__right-block">
            <div className="members-management">
              <div className={`search-section ${isFieldDisabled ? 'hidden' : ''}`}>
                <div className="search-input-container">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleTeamSearch(); // Добавляем мгновенный поиск
                    }}
                    onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Поиск по участникам проекта"
                    disabled={isFieldDisabled}
                  />
                  <button onClick={handleSearch} disabled={isSearching || isFieldDisabled}>
                    {isSearching ? 'Поиск...' : 'Найти'}
                  </button>
                </div>

                <select
                  value={selectedProjectRole}
                  onChange={(e) => setSelectedProjectRole(e.target.value as projectRoles)}
                  className="role-select"
                >
                  {Object.values(projectRoles).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>

                {searchResults.length > 0 ? (
                  <div className="search-results">
                    {searchResults.map(user => (
                      <div 
                        key={user.primarykey} 
                        className="user-result" 
                        onClick={() => handleProjectAddMember(user)}
                      >
                        <img 
                          src={user.avatarUrl || '/default-avatar.png'} 
                          alt="Avatar" 
                          className="user-avatar"
                        />
                        <div className="user-info">
                          <span className="user-login">{user.login}</span>
                          <span className="user-name">{user.firstName} {user.lastName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  !isSearching && searchQuery.trim() !== '' && (
                    <div className="no-results-message">
                      Пользователей не найдено
                    </div>
                  )
                )}
              </div>

              <div className="current-members">
                <h4>Участники проекта:</h4>
                {form.ProjectMember.map(member => (
                  <div key={member.primarykey} className="member-item">
                    <div className="member-info">
                      <div className="edit-modal__member-avatar">
                        <img src={member.account?.avatarUrl || '/default-avatar.png'} alt="Avatar" />
                      </div>
                      <div className="member-name-container">
                        <span>{member.account?.firstName} {member.account?.lastName}</span>
                        <select
                          value={member.role.name}
                          onChange={(e) => updateProjectMemberRole(member.primarykey, e.target.value as projectRoles)}
                          className="role-select"
                          disabled={isFieldDisabled}
                        >
                          {Object.values(projectRoles).map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  {member.accountId !== authUser?.id && !isFieldDisabled ? (
                    <button 
                      className="remove-button"
                      onClick={() => {
                        const updatedProjectMembers = form.ProjectMember.filter(m => 
                          m.primarykey !== member.primarykey
                        );
                        
                        const updatedTeams = form.teams.map(team => ({
                          ...team,
                          members: team.members.filter(m => 
                            m.accountId !== member.accountId
                          )
                        }));

                        setForm({
                          ...form,
                          ProjectMember: updatedProjectMembers,
                          teams: updatedTeams
                        });

                        if (selectedTeam) {
                          const freshSelectedTeam = form.teams.find(t => t.primarykey === selectedTeam.primarykey);
                          if (freshSelectedTeam) setSelectedTeam(freshSelectedTeam);
                        }
                      }}
                    >
                      ×
                    </button>
                    ) : (
                      <span>{isFieldDisabled ? '' : 'Вы'}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="edit-modal__footer">
          <button 
            onClick={onClose}
            className="edit-modal__cancel-button"
          >
            Отмена
          </button>
          <button 
            onClick={handleSubmit}
            className="edit-modal__save-button"
          >
            {isEditing ? 'Сохранить изменения' : 'Создать проект'}
          </button>
        </div>
      </div>
    </Dialog>
  );
};