import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Project, Team, ProjectMember, TeamMember, User } from '../../types/project';
import { projectRoles, teamRoles } from '../../types/project';
import { ProjectsApi } from '../../api/projects';
import { createApiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import './styles/project-settings.scss';

interface ProjectSettingsModalProps {
  project: Project;
  onClose: () => void;
  onUpdate: (project: Project) => void;
}

export const ProjectSettingsModal = ({ 
  project,
  onClose,
  onUpdate
}: ProjectSettingsModalProps) => {
  const apiClient = createApiClient();
  const { user: authUser } = useAuth();
  
  const [form, setForm] = useState<Project>({
    ...project,
    ProjectMember: project.ProjectMember || [],
    teams: project.teams || []
  });
  
  const [logoPreview, setLogoPreview] = useState(project.logoUrl || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProjectRole, setSelectedProjectRole] = useState<projectRoles>(projectRoles.USER);
  const [selectedTeamRole, setSelectedTeamRole] = useState<teamRoles>(teamRoles.MEMBER);

//   useEffect(() => {
//     if (authUser && !form.ProjectMember.some(m => m.accountId === authUser.id)) {
//       handleProjectAddMember({
//         primarykey: authUser.id,
//         firstName: authUser.firstName,
//         lastName: authUser.lastName,
//         email: authUser.email,
//         login: authUser.login,
//         avatarUrl: authUser.avatarUrl,
//       });
//     }
//   }, [authUser]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await apiClient.get(`/users/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTeamSearch = () => {
    const projectMembers = form.ProjectMember
      .map(m => m.account)
      .filter(Boolean) as User[];
    
    const filtered = projectMembers.filter(user => {
      const searchStr = `${user.login} ${user.email} ${user.firstName} ${user.lastName}`.toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    });
    setSearchResults(filtered);
  };

  const handleProjectAddMember = (user: User) => {
    if (form.ProjectMember.some(m => m.accountId === user.primarykey)) {
      alert('Пользователь уже добавлен');
      return;
    }

    setForm({
      ...form,
      ProjectMember: [
        ...form.ProjectMember,
        {
          primarykey: '',
          accountId: user.primarykey,
          role: { name: selectedProjectRole },
          account: user
        }
      ]
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAddTeamMember = (user: User) => {
    if (!selectedTeam) return;

    console.log('fds ', user)

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

    console.log(newMember)

    setForm({
      ...form,
      teams: form.teams.map(t => t.primarykey === selectedTeam.primarykey ? updatedTeam : t)
    });
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
    setSelectedTeam(updatedTeams.find(t => t.primarykey === selectedTeam?.primarykey) || null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
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

      let updatedProject = { ...form };
      
      if (logoFile) {
        const uploadResponse = await ProjectsApi.uploadLogo(form.primarykey, logoFile);
        updatedProject.logoUrl = uploadResponse.logoUrl;
      }

      console.log(project.primarykey, updatedProject)
      const savedProject = await ProjectsApi.updateProject(project.primarykey, updatedProject);
      onUpdate(savedProject);
      onClose();
    } catch (err) {
      console.error('Ошибка сохранения проекта:', err);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="project-settings-modal">
      <div className="modal-overlay" aria-hidden="true" />
      
      <div className="modal-content">
        <Dialog.Title className="modal-header">
          Настройки проекта
          <button onClick={onClose} className="close-button">×</button>
        </Dialog.Title>

        <div className="modal-body">
          <div className="settings-section">
            <h3>Основные настройки</h3>
            <div className="logo-upload">
              {logoPreview && (
                <div className="logo-actions">
                  <button
                    className="clear-button"
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
                className="project-logo"
                alt="Логотип проекта"
              />
              <label className="upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                {logoPreview ? 'Изменить' : 'Добавить логотип'}
              </label>
            </div>

            <div className="form-group">
              <label>Название проекта</label>
              <input
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Статус проекта</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({...form, status: e.target.value as any})}
                  className="edit-modal__status-select"
                >
                  {['В работе', 'Завершен', 'Приостановлен'].map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
            </div>

            <div className="form-group">
              <label>Сроки выполнения</label>
              <div className="date-inputs">
                <input
                  type="date"
                  value={new Date(form.startDate).toISOString().split('T')[0]}
                  onChange={(e) => setForm({...form, startDate: e.target.value})}
                />
                <span>—</span>
                <input
                  type="date"
                  value={new Date(form.endDate).toISOString().split('T')[0]}
                  onChange={(e) => setForm({...form, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Описание проекта</label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm({...form, description: e.target.value})}
                placeholder="Добавьте описание проекта..."
              />
            </div>
          </div>

          <div className="settings-section">
            <h3>Управление командами</h3>
            <div className="team-creator">
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Название новой команды"
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
              >
                Добавить команду
              </button>
            </div>

            <div className="teams-list">
              {form.teams.map(team => (
                <div key={team.primarykey} className="team-card">
                  <div className="team-header">
                    <h4>{team.name}</h4>
                    <button onClick={() => setSelectedTeam(team)}>
                      Управление
                    </button>
                  </div>
                  <div className="team-members">
                    {team.members.map(member => (
                      <div key={member.primarykey} className="member-item">
                        <span>
                          {member.account?.firstName} {member.account?.lastName}
                        </span>
                        <span>{member.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedTeam && (
            <div className="team-management-modal">
              <div className="modal-content">
                <h4>Управление командой: {selectedTeam.name}</h4>
                
                <div className="members-section">
                  <div className="available-members">
                    <h5>Доступные участники:</h5>
                    {form.ProjectMember
                      .filter(pm => !selectedTeam.members.some(m => m.accountId === pm.accountId))
                      .map(pm => (
                        <div key={pm.primarykey} className="member-item">
                          <span>{pm.account?.firstName} {pm.account?.lastName}</span>
                          <button onClick={() => handleAddTeamMember(pm.account as User)}>
                            Добавить
                          </button>
                        </div>
                      ))}
                  </div>

                  <div className="current-members">
                    <h5>Участники команды:</h5>
                    {selectedTeam.members.map(member => (
                      <div key={member.primarykey} className="member-item">
                        <span>{member.account?.firstName} {member.account?.lastName}</span>
                        <select
                          value={member.role}
                          onChange={(e) => 
                            updateTeamMemberRole(member.primarykey, e.target.value as teamRoles)
                          }
                        >
                          {Object.values(teamRoles).map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => {
                            const updatedMembers = selectedTeam.members
                              .filter(m => m.primarykey !== member.primarykey);
                            setSelectedTeam({...selectedTeam, members: updatedMembers});
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => setSelectedTeam(null)}>Закрыть</button>
              </div>
            </div>
          )}

          <div className="settings-section">
            <h3>Участники проекта</h3>
            <div className="members-management">
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
                />
                <button onClick={handleSearch}>
                {isSearching ? 'Поиск...' : 'Найти'}
                </button>
                <select
                  value={selectedProjectRole}
                  onChange={(e) => setSelectedProjectRole(e.target.value as projectRoles)}
                >
                  {Object.values(projectRoles).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="search-results">
                {searchResults.map(user => (
                  <div 
                    key={user.primarykey} 
                    className="user-result"
                    onClick={() => handleProjectAddMember(user)}
                  >
                    <img 
                      src={user.avatarUrl || '/default-avatar.png'} 
                      alt={user.login} 
                    />
                    <div>
                      <div>{user.login}</div>
                      <div>{user.firstName} {user.lastName}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="current-members">
                {form.ProjectMember.map(member => (
                  <div key={member.primarykey} className="member-item">
                    <div className="member-info">
                      <img 
                        src={member.account?.avatarUrl || '/default-avatar.png'} 
                        alt="Avatar" 
                      />
                      <div>
                        <div>{member.account?.firstName} {member.account?.lastName}</div>
                        <select
                          value={member.role?.name || projectRoles.USER}
                          onChange={(e) => 
                            updateProjectMemberRole(member.primarykey, e.target.value as projectRoles)
                          }
                        >
                          {Object.values(projectRoles).map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {member.accountId !== authUser?.id && (
                      <button 
                        onClick={() => {
                          setForm({
                            ...form,
                            ProjectMember: form.ProjectMember.filter(m => 
                              m.primarykey !== member.primarykey
                            )
                          });
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose}>Отмена</button>
          <button onClick={handleSubmit}>Сохранить изменения</button>
        </div>
      </div>
    </Dialog>
  );
};